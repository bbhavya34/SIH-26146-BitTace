# BitTrace — Bitcoin Forensic Intelligence Platform

> **SIH 2026 | Problem Statement PS-26146 | NTRO Cyber Division**
> AI-powered offline Bitcoin transaction monitoring, graph link analysis, and forensic investigation system.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Data Flow Diagram](#data-flow-diagram)
4. [Database Schema](#database-schema)
5. [ML Forensic Pipeline](#ml-forensic-pipeline)
6. [Money-Laundering Typologies](#money-laundering-typologies)
7. [Risk Scoring Model](#risk-scoring-model)
8. [Graph Link Analysis](#graph-link-analysis)
9. [API Architecture](#api-architecture)
10. [Frontend Component Architecture](#frontend-component-architecture)
11. [Investigation Workflow](#investigation-workflow)
12. [Getting Started](#getting-started)

---

## Project Overview

BitTrace is a **fully offline** forensic intelligence platform designed for analysing Bitcoin transaction networks to detect money-laundering typologies, identify high-risk wallet clusters, and generate structured investigation dockets for NTRO analysts.

| Layer | Technology |
|---|---|
| Backend API | FastAPI + Python 3.10+ |
| ML Engine | scikit-learn (Isolation Forest, DBSCAN) |
| Graph Analytics | NetworkX (directed graph, centrality) |
| Storage | PostgreSQL — persistent relational storage |
| Report Generation | ReportLab (PDF dossiers) |
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Data Visualisation | Recharts |

---

## System Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend — React + TypeScript (Port 5173)"]
        UI_DASH["Dashboard Page"]
        UI_ING["Data Ingestion Page"]
        UI_TX["Transactions Page"]
        UI_WAL["Wallets Page"]
        UI_GRAPH["Network Graph Page"]
        UI_LEADS["Intelligence Leads"]
        UI_CASES["Case Dockets"]
        UI_RPT["Forensic Reports"]
    end

    subgraph API["Backend API — FastAPI (Port 8000)"]
        EP_STATS["/stats"]
        EP_UPLOAD["/upload"]
        EP_DEMO["/generate-demo-data"]
        EP_TX["/transactions"]
        EP_WAL["/wallets"]
        EP_GRAPH["/graph"]
        EP_LEADS["/leads"]
        EP_CASES["/cases CRUD"]
        EP_REPORTS["/reports/id"]
        EP_SEARCH["/search"]
    end

    subgraph ML["ML Forensic Pipeline"]
        S1["Stage 1: Ingestion and Standardisation"]
        S2["Stage 2: Feature Engineering"]
        S3["Stage 3: Isolation Forest"]
        S4["Stage 4: NetworkX Graph"]
        S5["Stage 5: DBSCAN Clustering"]
        S6["Stage 6: Weighted Risk Fusion"]
        S7["Stage 7: DB Persist and Lead Gen"]
    end

    subgraph DB["PostgreSQL"]
        T_TX["transactions"]
        T_WAL["wallets"]
        T_IPS["wallet_ips"]
        T_LEADS["leads"]
        T_CASES["cases"]
        T_PIPE["pipeline_state"]
    end

    Frontend -- "REST API calls (fetch)" --> API
    EP_UPLOAD --> S1
    EP_DEMO --> S1
    S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7
    S7 --> DB
    API --> DB
```

---

## Data Flow Diagram

```mermaid
flowchart LR
    RAW["Raw Input\nCSV or JSON\nTransaction Dump"]
    VALIDATE["Schema Validation\nand Column Mapping\ntxid, wallet_from,\nwallet_to, amount,\ntimestamp, ip, port"]
    FEAT["Feature Engineering\n- Velocity / burst density\n- Fan-in / fan-out ratio\n- Structuring score\n- IP diversity"]
    ISO["Isolation Forest\nAnomaly Detection\nn_estimators=100\ncontamination=0.15"]
    NX["NetworkX\nGraph Construction\n- Degree centrality\n- Betweenness centrality\n- Peel chain detection"]
    DBSCAN_N["DBSCAN\nBehavioural Clustering\neps=0.75, min_samples=3"]
    RISK["Weighted Risk Fusion\n30% anomaly score\n25% burst score\n20% structuring score\n15% peel chain flag\n10% graph centrality"]
    STORE["PostgreSQL Storage\n- transactions\n- wallets\n- wallet_ips\n- leads\n- cases"]
    LEADS["Intelligence Lead\nGeneration\n- Peel Chain rule\n- Fan-In Structuring rule\n- Rapid Burst rule\n- IF Anomaly rule"]
    UI["Frontend Dashboard\n- Risk distribution\n- Typology heatmap\n- Network graph\n- Case management"]

    RAW --> VALIDATE --> FEAT --> ISO --> NX --> DBSCAN_N --> RISK --> STORE
    STORE --> LEADS
    STORE --> UI
    LEADS --> UI
```

---

## Database Schema

```mermaid
erDiagram
    TRANSACTIONS {
        TEXT txid PK
        TEXT wallet_from
        TEXT wallet_to
        REAL amount
        TEXT timestamp
        TEXT ip
        INTEGER port
        REAL anomaly_score
        REAL risk_score
        TEXT risk_level
        TEXT risk_factors
        INTEGER cluster_id
        INTEGER graph_degree
        REAL betweenness
        INTEGER is_peel_chain
        TEXT typology
    }

    WALLETS {
        TEXT address PK
        REAL total_sent
        REAL total_received
        INTEGER tx_count
        REAL velocity
        INTEGER unique_ips
        INTEGER counterparties_count
        REAL risk_score
        TEXT risk_level
        TEXT risk_factors
    }

    WALLET_IPS {
        INTEGER id PK
        TEXT wallet
        TEXT ip
        INTEGER tx_count
        TEXT last_seen
        REAL correlation_confidence
    }

    LEADS {
        TEXT id PK
        TEXT entity_type
        TEXT entity_id
        TEXT severity
        REAL confidence
        TEXT rule_triggered
        TEXT summary
        TEXT status
        TEXT created_at
    }

    CASES {
        TEXT id PK
        TEXT title
        TEXT description
        TEXT priority
        TEXT status
        TEXT target_entity
        TEXT lead_id
        TEXT investigator_notes
        TEXT created_at
        TEXT updated_at
    }

    PIPELINE_STATE {
        INTEGER id PK
        TEXT current_stage
        INTEGER progress_pct
        INTEGER is_running
        TEXT message
        TEXT updated_at
    }

    TRANSACTIONS }o--|| WALLETS : "wallet_from"
    TRANSACTIONS }o--|| WALLETS : "wallet_to"
    WALLET_IPS }o--|| WALLETS : "wallet"
    LEADS }o--o| CASES : "linked via lead_id"
```

---



---

## Risk Scoring Model

```mermaid
flowchart LR
    A["Anomaly Score\nIsolation Forest\nx 0.30"]
    B["Burst Score\n300s velocity window\nx 0.25"]
    C["Structuring Score\nAML threshold proximity\nx 0.20"]
    D["Peel Chain Flag\ngraph pattern match\nx 0.15"]
    E["Graph Centrality\ndegree + betweenness\nx 0.10"]

    A --> FUSE["Weighted Sum\nraw_risk = sum of wi x scorei"]
    B --> FUSE
    C --> FUSE
    D --> FUSE
    E --> FUSE

    FUSE --> BOOST{"Known typology?"}
    BOOST -->|"PEEL_CHAIN FAN_IN FAN_OUT RAPID_BURST"| FLOOR["Baseline floor\nmax raw_risk 72.0"]
    BOOST -->|"NORMAL"| CLIP["Clip to 4.2 to 99.4"]
    FLOOR --> CLIP

    CLIP --> LVL{"Classify"}
    LVL -->|">=75"| CRIT["CRITICAL"]
    LVL -->|"55-74"| HIGH["HIGH"]
    LVL -->|"30-54"| MED["MEDIUM"]
    LVL -->|"<30"| LOW["LOW"]
```

---

## Graph Link Analysis

```mermaid
graph LR
    subgraph "NetworkX Directed Transaction Graph"
        W1["Wallet A\nCRITICAL"]
        W2["Wallet B\nHIGH"]
        W3["Wallet C\nMEDIUM"]
        IP1["IP: 185.220.101.5\nTor Exit Node"]
        IP2["IP: 194.26.29.11\nVPN Cluster"]

        W1 -->|"24.4 BTC PEEL_CHAIN"| W2
        W2 -->|"23.9 BTC PEEL_CHAIN"| W3
        W1 -.->|"IP Observed"| IP1
        W2 -.->|"IP Observed"| IP1
        W3 -.->|"IP Observed"| IP2
    end

    subgraph "Centrality Metrics Computed"
        DC["Degree Centrality\n= connections / N-1"]
        BC["Betweenness Centrality\n= shortest paths through node"]
        PDet["Peel Chain Detection\nin>=1, out=2\nweight ratio > 4x"]
    end
```

---

## API Architecture

```mermaid
graph LR
    subgraph "Ingestion and Control"
        A1["GET /pipeline/status"]
        A2["POST /generate-demo-data"]
        A3["POST /upload"]
    end

    subgraph "Analytics"
        B1["GET /stats"]
        B2["GET /transactions"]
        B3["GET /transactions/txid"]
        B4["GET /wallets"]
        B5["GET /wallets/address"]
        B6["GET /graph"]
    end

    subgraph "Investigations"
        C1["GET /leads"]
        C2["GET /cases"]
        C3["POST /cases"]
        C4["PATCH /cases/id"]
        C5["DELETE /cases/id"]
    end

    subgraph "Export and Search"
        D1["GET /reports/id?format=pdf"]
        D2["GET /reports/id?format=csv"]
        D3["GET /export/transactions.csv"]
        D4["GET /search?q=query"]
    end
```

---

## Frontend Component Architecture

```mermaid
graph TB
    APP["App.tsx\nState Orchestrator"]

    subgraph Layout
        NAV["Navbar.tsx\nFloating pill nav + search"]
        SSIDEBAR["SubSidebar.tsx\nForensic nav groups"]
    end

    subgraph Pages
        DASH["DashboardPage\nKPI cards, Pipeline stepper\nRisk distribution, Timeline"]
        ING["IngestionPage\nCSV/JSON upload\nDemo generator, Console"]
        TX["TransactionsPage\nPaginated table\nFilters and detail modal"]
        WAL["WalletsPage\nRisk-sorted grid\nIP correlations, Tx history"]
        GRAPH["GraphPage\nForce-directed canvas\nWallet, IP, TX nodes"]
        LEADS["LeadsPage\nIntelligence feed\nEscalate to case"]
        CASES["CasesPage\nCRUD case dockets\nPriority status workflow"]
        RPT["ReportsPage\nPDF dossier export\nCSV download"]
    end

    subgraph Common
        SEARCH["GlobalSearchDialog\nCtrl+K — TX Wallet IP Case"]
        CASEDLG["CreateCaseDialog"]
    end

    API_SVC["api.ts\nTyped fetch wrappers"]

    APP --> NAV
    APP --> SSIDEBAR
    APP --> DASH
    APP --> ING
    APP --> TX
    APP --> WAL
    APP --> GRAPH
    APP --> LEADS
    APP --> CASES
    APP --> RPT
    APP --> SEARCH
    APP --> CASEDLG
    DASH --> API_SVC
    ING --> API_SVC
    TX --> API_SVC
    WAL --> API_SVC
    GRAPH --> API_SVC
    LEADS --> API_SVC
    CASES --> API_SVC
    RPT --> API_SVC
    SEARCH --> API_SVC
```

---

## Investigation Workflow

```mermaid
sequenceDiagram
    participant Analyst
    participant Frontend
    participant API
    participant ML as ML Pipeline
    participant DB as PostgreSQL DB

    Analyst->>Frontend: Upload CSV/JSON or trigger Demo
    Frontend->>API: POST /upload or POST /generate-demo-data
    API->>ML: run_forensic_pipeline(raw_txs)

    ML->>ML: Stage 1 — Ingest and Standardise
    ML->>ML: Stage 2 — Feature Engineering
    ML->>ML: Stage 3 — Isolation Forest anomaly_score
    ML->>ML: Stage 4 — NetworkX Graph centrality and peel chains
    ML->>ML: Stage 5 — DBSCAN Clustering
    ML->>ML: Stage 6 — Weighted Risk Fusion
    ML->>DB: Stage 7 — Persist transactions, wallets, leads
    ML-->>API: transactions_processed, high_risk_count, duration
    API-->>Frontend: Pipeline summary

    Analyst->>Frontend: Review Dashboard KPIs
    Frontend->>API: GET /stats
    API-->>Frontend: Risk distribution, typology breakdown, timeline

    Analyst->>Frontend: Explore Network Graph
    Frontend->>API: GET /graph?min_risk=55
    API-->>Frontend: nodes and edges arrays

    Analyst->>Frontend: Review Intelligence Lead
    Frontend->>API: GET /leads
    API-->>Frontend: Leads list

    Analyst->>Frontend: Escalate Lead to Create Case
    Frontend->>API: POST /cases with lead_id and target_entity
    API->>DB: INSERT case and UPDATE lead status to ESCALATED
    API-->>Frontend: Case object

    Analyst->>Frontend: Export Case Dossier
    Frontend->>API: GET /reports/case_id?format=pdf
    API-->>Analyst: ReportLab PDF binary
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
$env:DATABASE_URL="postgresql://user:password@localhost:5432/bittrace"
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend requires `DATABASE_URL`, a PostgreSQL connection string. On Render, set
`DATABASE_URL` to the internal URL from the attached PostgreSQL database and set
`ALLOWED_ORIGINS` to the deployed frontend URL.

API docs available at: `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at: `http://localhost:5173`

### Production deployment

The repository includes `render.yaml` for deploying the FastAPI service and a
managed PostgreSQL database on Render. Set `ALLOWED_ORIGINS` to the final
frontend origin in the Render dashboard.

Deploy the `frontend` directory to Vercel with:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Environment: VITE_API_BASE_URL=https://your-api.onrender.com
```

After the frontend is deployed, copy its URL into the backend's
`ALLOWED_ORIGINS` value and redeploy the API.

### Input Schema

Upload CSV or JSON files with the following fields (aliases are auto-mapped):

| Field | Aliases | Type | Description |
|---|---|---|---|
| `txid` | `tx_id`, `hash` | string | Unique transaction identifier |
| `wallet_from` | `from_address`, `sender` | string | Source Bitcoin address |
| `wallet_to` | `to_address`, `recipient` | string | Destination Bitcoin address |
| `amount` | `value`, `btc_amount` | float | Transaction amount in BTC |
| `timestamp` | `time` | ISO 8601 string | Transaction datetime |
| `ip` | `ip_address` | string | Observed network IP address |
| `port` | — | integer | P2P port (default: 8333) |

### Risk Level Thresholds

| Level | Score Range | Action |
|---|---|---|
| `CRITICAL` | >= 75.0 | Immediate escalation to case |
| `HIGH` | 55.0 – 74.9 | Intelligence lead generated |
| `MEDIUM` | 30.0 – 54.9 | Flagged for review |
| `LOW` | < 30.0 | Baseline normal |

---

> Built for **NTRO PS-26146** | SIH 2026 | Analysis runs on persistent PostgreSQL storage.
