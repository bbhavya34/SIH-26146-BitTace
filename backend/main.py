"""
BitTrace FastAPI Application
AI-Powered Bitcoin Transaction Monitoring & Forensic Investigation Backend (SIH 2026 / NTRO PS 26146)
"""
import io
import csv
import json
import uuid
import hashlib
import os
from datetime import datetime
from typing import List, Dict, Any, Optional, Literal
from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Response, Path, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field, field_validator
from starlette.middleware.base import BaseHTTPMiddleware

MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def escape_like(value: str) -> str:
    """Escape LIKE wildcards so search input is treated as literal text."""
    return value.replace("!", "!!").replace("%", "!%").replace("_", "!_")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        return response

from database import (
    init_db, get_db_connection, get_pipeline_state, update_pipeline_state
)
from generator.demo_data import generate_synthetic_transactions
from ml.pipeline import run_forensic_pipeline
from reports.pdf_generator import generate_case_pdf

app = FastAPI(
    title="BitTrace Forensic Intelligence API",
    description="Backend API for Bitcoin Transaction Monitoring, Graph Link Analysis & Anomaly Detection",
    version="1.0.0"
)

# Enable CORS for local development and the deployed frontend origin.
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)


def get_health_status(request: Request):
    database_status = "ok"
    try:
        conn = get_db_connection()
        conn.cursor().execute("SELECT 1")
        conn.close()
    except Exception:
        database_status = "unavailable"

    request_origin = request.headers.get("origin")
    return {
        "status": "ok" if database_status == "ok" else "degraded",
        "service": "bittrace-api",
        "version": app.version,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "database": database_status,
        "cors": {
            "request_origin": request_origin,
            "origin_allowed": request_origin in allowed_origins if request_origin else None,
        },
    }


@app.get("/", tags=["health"])
@app.get("/health", tags=["health"])
def health_check(request: Request):
    return get_health_status(request)

# Initialize database on startup
@app.on_event("startup")
def on_startup():
    init_db()
    # Check if empty, generate initial baseline demo dataset
    conn = get_db_connection()
    count = conn.cursor().execute("SELECT COUNT(*) AS count FROM transactions").fetchone()["count"]
    conn.close()
    if count == 0:
        demo_txs = generate_synthetic_transactions(120)
        run_forensic_pipeline(demo_txs)

# -------------------------------------------------------------
# Pydantic Request Models
# -------------------------------------------------------------
class CaseCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=5000)
    priority: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"] = "HIGH"
    status: Literal["OPEN", "UNDER_INVESTIGATION", "ESCALATED"] = "OPEN"
    target_entity: str = Field(min_length=1, max_length=200)
    lead_id: Optional[str] = Field(default=None, max_length=100)
    investigator_notes: Optional[str] = Field(default="", max_length=10000)

class CaseUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=5000)
    priority: Optional[Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]] = None
    status: Optional[Literal["OPEN", "UNDER_INVESTIGATION", "ESCALATED", "CLOSED"]] = None
    investigator_notes: Optional[str] = Field(default=None, max_length=10000)

# -------------------------------------------------------------
# 1. Pipeline & Ingestion Endpoints
# -------------------------------------------------------------
@app.get("/pipeline/status")
def get_status():
    return get_pipeline_state()

@app.post("/generate-demo-data")
def generate_demo():
    """
    Seeds synthetic dataset with known laundering typologies (Peel Chain, Smurfing, Layering, Rapid Bursts).
    """
    update_pipeline_state("GENERATING", 5, True, "Generating ground-truth synthetic transaction dataset...")
    txs = generate_synthetic_transactions(130)
    result = run_forensic_pipeline(txs)
    return {"status": "success", "message": "Demo data generated and ingested successfully", "stats": result}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Accepts CSV or JSON transaction datasets, applies column-mapping schema validation, and triggers pipeline.
    """
    filename = file.filename.lower()
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Uploaded file exceeds the 10 MB limit.")
    raw_txs = []
    dataset_id = str(uuid.uuid4())
    source_format = filename.rsplit('.', 1)[-1].upper() if '.' in filename else 'UNKNOWN'
    
    if filename.endswith(".json"):
        try:
            raw_txs = json.loads(content.decode("utf-8"))
            if not isinstance(raw_txs, list):
                raise ValueError("JSON must contain an array of transaction objects.")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON file: {str(e)}")
            
    elif filename.endswith(".csv"):
        try:
            reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
            for row in reader:
                # Column mapping normalization
                tx = {
                    "txid": row.get("txid") or row.get("tx_id") or row.get("hash") or str(uuid.uuid4()),
                    "wallet_from": row.get("wallet_from") or row.get("from_address") or row.get("sender") or "UNKNOWN_SRC",
                    "wallet_to": row.get("wallet_to") or row.get("to_address") or row.get("recipient") or "UNKNOWN_DST",
                    "amount": float(row.get("amount") or row.get("value") or row.get("btc_amount") or 0.0),
                    "timestamp": row.get("timestamp") or row.get("time") or datetime.utcnow().isoformat() + "Z",
                    "ip": row.get("ip") or row.get("ip_address") or "127.0.0.1",
                    "port": int(row.get("port") or 8333),
                    "typology": row.get("typology", "UNCLASSIFIED")
                }
                raw_txs.append(tx)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV file format: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or JSON.")
        
    if not raw_txs:
        raise HTTPException(status_code=400, detail="Uploaded file contained no valid transaction records.")

    created_at = datetime.utcnow().isoformat()
    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO datasets (
            id, filename, source_format, file_sha256, row_count,
            accepted_count, rejected_count, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            dataset_id,
            file.filename or 'uploaded-dataset',
            source_format,
            hashlib.sha256(content).hexdigest(),
            len(raw_txs),
            len(raw_txs),
            0,
            "PROCESSING",
            created_at,
        ),
    )
    conn.executemany(
        """
        INSERT INTO source_records (
            dataset_id, source_row_number, raw_payload, normalized_payload,
            validation_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        [
            (
                dataset_id,
                row_number,
                json.dumps(transaction),
                json.dumps(transaction),
                "ACCEPTED",
                created_at,
            )
            for row_number, transaction in enumerate(raw_txs, start=1)
        ],
    )
    conn.commit()
    conn.close()
        
    # Execute pipeline
    result = run_forensic_pipeline(raw_txs)

    conn = get_db_connection()
    conn.execute(
        "UPDATE datasets SET status = ? WHERE id = ?",
        ("PROCESSED", dataset_id),
    )
    conn.commit()
    conn.close()

    return {
        "dataset_id": dataset_id,
        "status": "success",
        "validation_report": {
            "total_rows_parsed": len(raw_txs),
            "schema_valid": True,
            "target_schema": ["txid", "wallet_from", "wallet_to", "amount", "timestamp", "ip", "port"]
        },
        "pipeline_result": result
    }

# -------------------------------------------------------------
# 2. Stats & Analytics Dashboard Endpoint
# -------------------------------------------------------------
@app.get("/stats")
def get_dashboard_stats():
    conn = get_db_connection()
    c = conn.cursor()
    
    total_tx = c.execute("SELECT COUNT(*) AS count FROM transactions").fetchone()["count"]
    total_vol = c.execute("SELECT SUM(amount) AS total FROM transactions").fetchone()["total"] or 0.0
    critical_tx = c.execute("SELECT COUNT(*) AS count FROM transactions WHERE risk_level = 'CRITICAL'").fetchone()["count"]
    high_tx = c.execute("SELECT COUNT(*) AS count FROM transactions WHERE risk_level = 'HIGH'").fetchone()["count"]
    total_wallets = c.execute("SELECT COUNT(*) AS count FROM wallets").fetchone()["count"]
    flagged_wallets = c.execute("SELECT COUNT(*) AS count FROM wallets WHERE risk_level IN ('CRITICAL', 'HIGH')").fetchone()["count"]
    total_leads = c.execute("SELECT COUNT(*) AS count FROM leads WHERE status = 'ACTIVE'").fetchone()["count"]
    total_cases = c.execute("SELECT COUNT(*) AS count FROM cases").fetchone()["count"]
    
    # Risk distribution
    risk_dist = {
        "CRITICAL": critical_tx,
        "HIGH": high_tx,
        "MEDIUM": c.execute("SELECT COUNT(*) AS count FROM transactions WHERE risk_level = 'MEDIUM'").fetchone()["count"],
        "LOW": c.execute("SELECT COUNT(*) AS count FROM transactions WHERE risk_level = 'LOW'").fetchone()["count"]
    }
    
    # Typology distribution
    c.execute("SELECT typology, COUNT(*) as cnt FROM transactions GROUP BY typology")
    typology_dist = {row["typology"]: row["cnt"] for row in c.fetchall()}
    
    # Volume timeline
    c.execute("SELECT substr(timestamp, 1, 13) as hr, COUNT(*) as cnt, SUM(amount) as vol, AVG(risk_score) as avg_risk FROM transactions GROUP BY hr ORDER BY hr ASC LIMIT 24")
    time_series = [{"hour": row["hr"] + ":00", "count": row["cnt"], "volume": round(row["vol"], 3), "avg_risk": round(row["avg_risk"], 1)} for row in c.fetchall()]
    
    conn.close()
    
    return {
        "total_transactions": total_tx,
        "total_volume_btc": round(total_vol, 4),
        "critical_alerts": critical_tx + high_tx,
        "total_wallets": total_wallets,
        "flagged_wallets": flagged_wallets,
        "active_leads": total_leads,
        "active_cases": total_cases,
        "risk_distribution": risk_dist,
        "typology_distribution": typology_dist,
        "timeline": time_series
    }

# -------------------------------------------------------------
# 3. Transactions Endpoints
# -------------------------------------------------------------
@app.get("/transactions")
def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=200),
    risk_level: Optional[str] = None,
    typology: Optional[str] = None,
    search: Optional[str] = Query(default=None, max_length=200),
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    sort_by: str = "timestamp",
    sort_order: str = "desc"
):
    conn = get_db_connection()
    c = conn.cursor()
    
    query = "SELECT * FROM transactions WHERE 1=1"
    params = []
    
    if risk_level and risk_level != "ALL":
        query += " AND risk_level = ?"
        params.append(risk_level)
        
    if typology and typology != "ALL":
        query += " AND typology = ?"
        params.append(typology)
        
    if min_amount is not None:
        query += " AND amount >= ?"
        params.append(min_amount)
        
    if max_amount is not None:
        query += " AND amount <= ?"
        params.append(max_amount)
        
    if search:
        search_term = f"%{escape_like(search.strip())}%"
        query += " AND (txid LIKE ? ESCAPE '!' OR wallet_from LIKE ? ESCAPE '!' OR wallet_to LIKE ? ESCAPE '!' OR ip LIKE ? ESCAPE '!')"
        params.extend([search_term, search_term, search_term, search_term])
        
    # Count total
    count_query = query.replace("SELECT *", "SELECT COUNT(*) AS count")
    total = c.execute(count_query, params).fetchone()["count"]
    
    # Sort & pagination
    allowed_sorts = {"timestamp", "amount", "risk_score", "anomaly_score"}
    sort_column = sort_by if sort_by in allowed_sorts else "timestamp"
    order_direction = "DESC" if sort_order.lower() == "desc" else "ASC"
    
    query += f" ORDER BY {sort_column} {order_direction} LIMIT ? OFFSET ?"
    params.extend([limit, (page - 1) * limit])
    
    rows = c.execute(query, params).fetchall()
    
    results = []
    for r in rows:
        factors = {}
        try:
            factors = json.loads(r["risk_factors"])
        except Exception:
            pass
        results.append({
            "txid": r["txid"],
            "wallet_from": r["wallet_from"],
            "wallet_to": r["wallet_to"],
            "amount": r["amount"],
            "timestamp": r["timestamp"],
            "ip": r["ip"],
            "port": r["port"],
            "anomaly_score": r["anomaly_score"],
            "risk_score": r["risk_score"],
            "risk_level": r["risk_level"],
            "risk_factors": factors,
            "cluster_id": r["cluster_id"],
            "graph_degree": r["graph_degree"],
            "is_peel_chain": bool(r["is_peel_chain"]),
            "typology": r["typology"]
        })
        
    conn.close()
    return {
        "items": results,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@app.get("/transactions/{txid}")
def get_transaction(txid: str = Path(..., min_length=1, max_length=200)):
    conn = get_db_connection()
    c = conn.cursor()
    row = c.execute("SELECT * FROM transactions WHERE txid = ?", (txid,)).fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    factors = {}
    try:
        factors = json.loads(row["risk_factors"])
    except Exception:
        pass
        
    # Get associated IP records
    ip_correlations = c.execute(
        "SELECT * FROM wallet_ips WHERE wallet = ? OR wallet = ?",
        (row["wallet_from"], row["wallet_to"])
    ).fetchall()
    
    conn.close()
    
    return {
        "txid": row["txid"],
        "wallet_from": row["wallet_from"],
        "wallet_to": row["wallet_to"],
        "amount": row["amount"],
        "timestamp": row["timestamp"],
        "ip": row["ip"],
        "port": row["port"],
        "anomaly_score": row["anomaly_score"],
        "risk_score": row["risk_score"],
        "risk_level": row["risk_level"],
        "risk_factors": factors,
        "cluster_id": row["cluster_id"],
        "graph_degree": row["graph_degree"],
        "betweenness": row["betweenness"],
        "is_peel_chain": bool(row["is_peel_chain"]),
        "typology": row["typology"],
        "associated_ips": [dict(ip) for ip in ip_correlations]
    }

# -------------------------------------------------------------
# 4. Wallets Endpoints
# -------------------------------------------------------------
@app.get("/wallets")
def list_wallets(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    risk_level: Optional[str] = None,
    search: Optional[str] = Query(default=None, max_length=200)
):
    conn = get_db_connection()
    c = conn.cursor()
    
    query = "SELECT * FROM wallets WHERE 1=1"
    params = []
    
    if risk_level and risk_level != "ALL":
        query += " AND risk_level = ?"
        params.append(risk_level)
        
    if search:
        query += " AND address LIKE ? ESCAPE '!'"
        params.append(f"%{escape_like(search.strip())}%")
        
    total = c.execute(query.replace("SELECT *", "SELECT COUNT(*) AS count"), params).fetchone()["count"]
    
    query += " ORDER BY risk_score DESC, total_sent + total_received DESC LIMIT ? OFFSET ?"
    params.extend([limit, (page - 1) * limit])
    
    rows = c.execute(query, params).fetchall()
    results = [dict(r) for r in rows]
    conn.close()
    
    return {
        "items": results,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@app.get("/wallets/{address}")
def get_wallet(address: str = Path(..., min_length=1, max_length=200)):
    conn = get_db_connection()
    c = conn.cursor()
    
    wallet_row = c.execute("SELECT * FROM wallets WHERE address = ?", (address,)).fetchone()
    if not wallet_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Wallet address not found")
        
    # Get associated transactions
    tx_rows = c.execute(
        "SELECT * FROM transactions WHERE wallet_from = ? OR wallet_to = ? ORDER BY timestamp DESC LIMIT 30",
        (address, address)
    ).fetchall()
    
    # Get associated IP telemetry
    ip_rows = c.execute(
        "SELECT * FROM wallet_ips WHERE wallet = ? ORDER BY correlation_confidence DESC",
        (address,)
    ).fetchall()
    
    conn.close()
    
    wallet_dict = dict(wallet_row)
    wallet_dict["associated_ips"] = [dict(ip) for ip in ip_rows]
    wallet_dict["recent_transactions"] = [dict(tx) for tx in tx_rows]
    
    return wallet_dict

# -------------------------------------------------------------
# 5. Graph Intelligence Endpoint
# -------------------------------------------------------------
@app.get("/graph")
def get_graph_data(
    min_risk: float = Query(0.0, ge=0.0, le=100.0),
    max_nodes: int = Query(150, ge=10, le=500),
    typology: Optional[str] = Query(default=None, max_length=100),
):
    """
    Returns graph representation of wallets, transactions, and IPs for interactive link analysis.
    """
    conn = get_db_connection()
    c = conn.cursor()
    
    query = "SELECT * FROM transactions WHERE risk_score >= ?"
    params = [min_risk]
    
    if typology and typology != "ALL":
        query += " AND typology = ?"
        params.append(typology)
        
    query += " ORDER BY risk_score DESC, amount DESC LIMIT ?"
    params.append(max_nodes)
    
    tx_rows = c.execute(query, params).fetchall()
    
    nodes_map = {}
    edges = []
    
    for tx in tx_rows:
        w_from = tx["wallet_from"]
        w_to = tx["wallet_to"]
        ip = tx["ip"]
        r_score = tx["risk_score"]
        r_lvl = tx["risk_level"]
        amt = tx["amount"]
        
        # Add Source Wallet Node
        if w_from not in nodes_map:
            nodes_map[w_from] = {
                "id": w_from,
                "label": w_from[:8] + "...",
                "full_id": w_from,
                "type": "WALLET",
                "risk_score": r_score,
                "risk_level": r_lvl,
                "cluster_id": tx["cluster_id"],
                "degree": tx["graph_degree"]
            }
        else:
            nodes_map[w_from]["risk_score"] = max(nodes_map[w_from]["risk_score"], r_score)
            
        # Add Destination Wallet Node
        if w_to not in nodes_map:
            nodes_map[w_to] = {
                "id": w_to,
                "label": w_to[:8] + "...",
                "full_id": w_to,
                "type": "WALLET",
                "risk_score": r_score,
                "risk_level": r_lvl,
                "cluster_id": tx["cluster_id"],
                "degree": tx["graph_degree"]
            }
        else:
            nodes_map[w_to]["risk_score"] = max(nodes_map[w_to]["risk_score"], r_score)
            
        # Add IP Node
        if ip and ip not in nodes_map and len(nodes_map) < max_nodes:
            nodes_map[ip] = {
                "id": ip,
                "label": f"IP: {ip}",
                "full_id": ip,
                "type": "IP",
                "risk_score": r_score * 0.85,
                "risk_level": r_lvl,
                "cluster_id": -1,
                "degree": 1
            }
            # Link wallet_from to IP
            edges.append({
                "source": w_from,
                "target": ip,
                "type": "IP_OBSERVATION",
                "label": "Observed IP",
                "weight": 1.0,
                "risk_score": r_score
            })
            
        # Add Transaction Edge between wallets
        edges.append({
            "source": w_from,
            "target": w_to,
            "type": "TRANSFER",
            "txid": tx["txid"],
            "amount": amt,
            "label": f"{amt:.2f} BTC",
            "risk_score": r_score,
            "risk_level": r_lvl,
            "typology": tx["typology"]
        })
        
    conn.close()
    
    return {
        "nodes": list(nodes_map.values()),
        "edges": edges,
        "total_nodes": len(nodes_map),
        "total_edges": len(edges)
    }

# -------------------------------------------------------------
# 6. Intelligence Leads Endpoints
# -------------------------------------------------------------
@app.get("/leads")
def list_leads(severity: Optional[str] = None):
    conn = get_db_connection()
    c = conn.cursor()
    
    query = "SELECT * FROM leads WHERE status = 'ACTIVE'"
    params = []
    if severity and severity != "ALL":
        query += " AND severity = ?"
        params.append(severity)
        
    query += " ORDER BY confidence DESC, created_at DESC"
    rows = c.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# -------------------------------------------------------------
# 7. Case Management Endpoints (CRUD)
# -------------------------------------------------------------
@app.get("/cases")
def list_cases(status: Optional[str] = None):
    conn = get_db_connection()
    c = conn.cursor()
    
    query = "SELECT * FROM cases WHERE 1=1"
    params = []
    if status and status != "ALL":
        query += " AND status = ?"
        params.append(status)
        
    query += " ORDER BY updated_at DESC"
    rows = c.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/cases")
def create_case(req: CaseCreateRequest):
    case_id = f"CASE-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.utcnow().isoformat() + "Z"
    
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
    INSERT INTO cases (id, title, description, priority, status, target_entity, lead_id, investigator_notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        case_id, req.title, req.description, req.priority, req.status,
        req.target_entity, req.lead_id, req.investigator_notes or "", now, now
    ))
    
    # If linked to a lead, update lead status to 'ESCALATED'
    if req.lead_id:
        c.execute("UPDATE leads SET status = 'ESCALATED' WHERE id = ?", (req.lead_id,))
        
    conn.commit()
    case_row = c.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    conn.close()
    
    return dict(case_row)

@app.get("/cases/{case_id}")
def get_case(case_id: str = Path(..., min_length=1, max_length=100)):
    conn = get_db_connection()
    c = conn.cursor()
    row = c.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Case not found")
    return dict(row)

@app.patch("/cases/{case_id}")
def update_case(req: CaseUpdateRequest, case_id: str = Path(..., min_length=1, max_length=100)):
    conn = get_db_connection()
    c = conn.cursor()
    
    existing = c.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Case not found")
        
    updates = []
    params = []
    
    if req.title is not None:
        updates.append("title = ?")
        params.append(req.title)
    if req.description is not None:
        updates.append("description = ?")
        params.append(req.description)
    if req.priority is not None:
        updates.append("priority = ?")
        params.append(req.priority)
    if req.status is not None:
        updates.append("status = ?")
        params.append(req.status)
    if req.investigator_notes is not None:
        updates.append("investigator_notes = ?")
        params.append(req.investigator_notes)
        
    updates.append("updated_at = ?")
    params.append(datetime.utcnow().isoformat() + "Z")
    params.append(case_id)
    
    c.execute(f"UPDATE cases SET {', '.join(updates)} WHERE id = ?", params)
    conn.commit()
    
    updated_row = c.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    conn.close()
    return dict(updated_row)

@app.delete("/cases/{case_id}")
def delete_case(case_id: str = Path(..., min_length=1, max_length=100)):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("DELETE FROM cases WHERE id = ?", (case_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Case {case_id} deleted."}

# -------------------------------------------------------------
# 8. Report Export Endpoints (PDF & CSV)
# -------------------------------------------------------------
@app.get("/reports/{case_id}")
def export_case_report(
    case_id: str = Path(..., min_length=1, max_length=100),
    format: Literal["pdf", "csv"] = "pdf",
):
    """
    Generates and returns official ReportLab PDF case dossier or CSV transaction export.
    """
    conn = get_db_connection()
    c = conn.cursor()
    
    case_row = c.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not case_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Case not found")
        
    case_dict = dict(case_row)
    target = case_dict.get("target_entity", "")
    
    # Fetch entity details
    wallet_row = c.execute("SELECT * FROM wallets WHERE address = ?", (target,)).fetchone()
    entity_details = dict(wallet_row) if wallet_row else {"address": target, "total_sent": 0.0, "total_received": 0.0, "risk_score": 75.0, "risk_level": "HIGH", "velocity": 1.2, "counterparties_count": 5}
    
    # Associated IPs
    ip_rows = c.execute("SELECT * FROM wallet_ips WHERE wallet = ?", (target,)).fetchall()
    entity_details["associated_ips"] = [dict(r) for r in ip_rows]
    
    # Transactions
    tx_rows = c.execute(
        "SELECT * FROM transactions WHERE wallet_from = ? OR wallet_to = ? ORDER BY timestamp DESC LIMIT 50",
        (target, target)
    ).fetchall()
    tx_list = [dict(r) for r in tx_rows]
    
    conn.close()
    
    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["txid", "wallet_from", "wallet_to", "amount_btc", "timestamp", "ip", "risk_score", "risk_level", "typology"])
        for tx in tx_list:
            writer.writerow([tx["txid"], tx["wallet_from"], tx["wallet_to"], tx["amount"], tx["timestamp"], tx["ip"], tx["risk_score"], tx["risk_level"], tx["typology"]])
        
        response = Response(content=output.getvalue(), media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename=case_{case_id}_transactions.csv"
        return response
        
    # PDF generation via ReportLab
    try:
        pdf_bytes = generate_case_pdf(case_dict, entity_details, tx_list)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename=BitTrace_Case_{case_id}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@app.get("/export/transactions.csv")
def export_all_transactions_csv():
    conn = get_db_connection()
    c = conn.cursor()
    rows = c.execute("SELECT txid, wallet_from, wallet_to, amount, timestamp, ip, port, anomaly_score, risk_score, risk_level, typology FROM transactions ORDER BY timestamp DESC").fetchall()
    conn.close()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["txid", "wallet_from", "wallet_to", "amount_btc", "timestamp", "ip", "port", "anomaly_score", "risk_score", "risk_level", "typology"])
    for r in rows:
        writer.writerow([r["txid"], r["wallet_from"], r["wallet_to"], r["amount"], r["timestamp"], r["ip"], r["port"], r["anomaly_score"], r["risk_score"], r["risk_level"], r["typology"]])
        
    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=bittrace_all_transactions.csv"
    return response

# -------------------------------------------------------------
# 9. Global Command Palette Search (Cmd+K)
# -------------------------------------------------------------
@app.get("/search")
def global_search(q: str = Query(..., min_length=1, max_length=200)):
    """
    Search across Transactions (TXID), Wallets, IPs, and Cases.
    """
    conn = get_db_connection()
    c = conn.cursor()
    term = f"%{escape_like(q.strip())}%"
    
    txs = c.execute("SELECT txid, amount, risk_score, risk_level, timestamp FROM transactions WHERE txid LIKE ? ESCAPE '!' LIMIT 5", (term,)).fetchall()
    wallets = c.execute("SELECT address, total_sent, total_received, risk_score, risk_level FROM wallets WHERE address LIKE ? ESCAPE '!' LIMIT 5", (term,)).fetchall()
    ips = c.execute("SELECT DISTINCT ip, wallet, correlation_confidence FROM wallet_ips WHERE ip LIKE ? ESCAPE '!' LIMIT 5", (term,)).fetchall()
    cases = c.execute("SELECT id, title, priority, status, target_entity FROM cases WHERE id LIKE ? ESCAPE '!' OR title LIKE ? ESCAPE '!' OR target_entity LIKE ? ESCAPE '!' LIMIT 5", (term, term, term)).fetchall()
    
    conn.close()
    
    return {
        "query": q,
        "transactions": [dict(t) for t in txs],
        "wallets": [dict(w) for w in wallets],
        "ips": [dict(i) for i in ips],
        "cases": [dict(cs) for cs in cases]
    }
