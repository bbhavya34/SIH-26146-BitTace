"""
BitTrace Database Layer - SQLite Storage for Forensic Data
"""
import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "bittrace.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        txid TEXT PRIMARY KEY,
        wallet_from TEXT NOT NULL,
        wallet_to TEXT NOT NULL,
        amount REAL NOT NULL,
        timestamp TEXT NOT NULL,
        ip TEXT NOT NULL,
        port INTEGER DEFAULT 8333,
        anomaly_score REAL DEFAULT 0.0,
        risk_score REAL DEFAULT 0.0,
        risk_level TEXT DEFAULT 'LOW',
        risk_factors TEXT DEFAULT '{}',
        cluster_id INTEGER DEFAULT -1,
        graph_degree INTEGER DEFAULT 0,
        betweenness REAL DEFAULT 0.0,
        is_peel_chain INTEGER DEFAULT 0,
        typology TEXT DEFAULT 'NORMAL'
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wallets (
        address TEXT PRIMARY KEY,
        total_sent REAL DEFAULT 0.0,
        total_received REAL DEFAULT 0.0,
        tx_count INTEGER DEFAULT 0,
        velocity REAL DEFAULT 0.0,
        unique_ips INTEGER DEFAULT 0,
        counterparties_count INTEGER DEFAULT 0,
        risk_score REAL DEFAULT 0.0,
        risk_level TEXT DEFAULT 'LOW',
        risk_factors TEXT DEFAULT '{}'
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wallet_ips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet TEXT NOT NULL,
        ip TEXT NOT NULL,
        tx_count INTEGER DEFAULT 1,
        last_seen TEXT,
        correlation_confidence REAL DEFAULT 50.0,
        UNIQUE(wallet, ip)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        severity TEXT NOT NULL,
        confidence REAL NOT NULL,
        rule_triggered TEXT NOT NULL,
        summary TEXT NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT DEFAULT 'OPEN',
        target_entity TEXT NOT NULL,
        lead_id TEXT,
        investigator_notes TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pipeline_state (
        id INTEGER PRIMARY KEY,
        current_stage TEXT NOT NULL,
        progress_pct INTEGER NOT NULL,
        is_running INTEGER DEFAULT 0,
        message TEXT DEFAULT '',
        updated_at TEXT NOT NULL
    )
    """)
    
    # Initialize pipeline state if not present
    cursor.execute("SELECT COUNT(*) FROM pipeline_state WHERE id = 1")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO pipeline_state (id, current_stage, progress_pct, is_running, message, updated_at)
        VALUES (1, 'IDLE', 0, 0, 'System ready for data ingestion', ?)
        """, (datetime.utcnow().isoformat(),))
        
    conn.commit()
    conn.close()

def update_pipeline_state(stage: str, progress: int, is_running: bool = True, message: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE pipeline_state 
    SET current_stage = ?, progress_pct = ?, is_running = ?, message = ?, updated_at = ?
    WHERE id = 1
    """, (stage, progress, 1 if is_running else 0, message, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()

def get_pipeline_state() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pipeline_state WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "current_stage": row["current_stage"],
            "progress_pct": row["progress_pct"],
            "is_running": bool(row["is_running"]),
            "message": row["message"],
            "updated_at": row["updated_at"]
        }
    return {"current_stage": "IDLE", "progress_pct": 0, "is_running": False, "message": "", "updated_at": ""}
