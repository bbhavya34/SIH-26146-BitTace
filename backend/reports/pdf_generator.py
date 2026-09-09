"""
BitTrace ReportLab Forensic Case Dossier Generator
Produces professional NTRO / Law Enforcement intelligence dossiers in PDF format.
"""
import os
import io
import json
from datetime import datetime
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)

def generate_case_pdf(case: Dict[str, Any], entity_details: Dict[str, Any], transactions: List[Dict[str, Any]]) -> bytes:
    """
    Generates a forensic investigation PDF report using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom SOC / Intelligence Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=14,
        spaceAfter=8
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    
    mono_style = ParagraphStyle(
        'MonospaceText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )
    
    badge_style = ParagraphStyle(
        'BadgeText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#ffffff')
    )
    
    story = []
    
    # -------------------------------------------------------------
    # 1. Header Banner & Security Classification
    # -------------------------------------------------------------
    class_table = Table(
        [[
            Paragraph("<b>NATIONAL TECHNICAL RESEARCH ORGANISATION (NTRO)</b><br/><font size=7 color='#64748b'>BLOCKCHAIN CYBER INTELLIGENCE DIVISION | PS 26146</font>", body_style),
            Paragraph("<font color='#b91c1c'><b>OFFICIAL FORENSIC DOSSIER</b></font><br/><font size=7 color='#64748b'>RESTRICTED ACCESS</font>", ParagraphStyle('RAlign', parent=body_style, alignment=2))
        ]],
        colWidths=[340, 190]
    )
    class_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(class_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f172a'), spaceBefore=4, spaceAfter=12))
    
    # Document Title
    story.append(Paragraph(f"Forensic Case Dossier: {case.get('id', 'CASE-001')}", title_style))
    story.append(Paragraph(f"Subject: {case.get('title', 'Bitcoin Transaction Investigation')} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", subtitle_style))
    
    # -------------------------------------------------------------
    # 2. Case Overview Table
    # -------------------------------------------------------------
    status_val = case.get('status', 'OPEN')
    priority_val = case.get('priority', 'HIGH')
    
    case_meta_data = [
        [
            Paragraph("<b>Case ID:</b>", body_style),
            Paragraph(str(case.get('id', 'N/A')), mono_style),
            Paragraph("<b>Investigation Status:</b>", body_style),
            Paragraph(f"<b>{status_val}</b>", body_style)
        ],
        [
            Paragraph("<b>Priority Level:</b>", body_style),
            Paragraph(f"<b>{priority_val}</b>", body_style),
            Paragraph("<b>Target Entity:</b>", body_style),
            Paragraph(str(case.get('target_entity', 'N/A')), mono_style)
        ],
        [
            Paragraph("<b>Linked Lead:</b>", body_style),
            Paragraph(str(case.get('lead_id', 'Direct Docket')), mono_style),
            Paragraph("<b>Created Timestamp:</b>", body_style),
            Paragraph(str(case.get('created_at', 'N/A')), body_style)
        ]
    ]
    
    meta_table = Table(case_meta_data, colWidths=[90, 175, 110, 155])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))
    
    # -------------------------------------------------------------
    # 3. Case Description & Target Entity Analysis
    # -------------------------------------------------------------
    story.append(Paragraph("1. Executive Summary & Target Profile", h2_style))
    story.append(Paragraph(case.get('description', 'No detailed description recorded.'), body_style))
    story.append(Spacer(1, 6))
    
    if entity_details:
        w_addr = entity_details.get("address", case.get("target_entity", "Unknown"))
        tot_sent = entity_details.get("total_sent", 0.0)
        tot_recv = entity_details.get("total_received", 0.0)
        risk_s = entity_details.get("risk_score", 0.0)
        risk_lvl = entity_details.get("risk_level", "LOW")
        counterparties = entity_details.get("counterparties_count", 0)
        velocity = entity_details.get("velocity", 0.0)
        
        ent_data = [
            [
                Paragraph("<b>Entity Address / Identifier:</b>", body_style),
                Paragraph(w_addr, mono_style)
            ],
            [
                Paragraph("<b>Total Volume (Sent / Recv):</b>", body_style),
                Paragraph(f"{tot_sent:.4f} BTC Sent  |  {tot_recv:.4f} BTC Received", body_style)
            ],
            [
                Paragraph("<b>Network Centrality / Counterparties:</b>", body_style),
                Paragraph(f"{counterparties} Counterparties  |  Velocity: {velocity:.2f} TX/hr", body_style)
            ],
            [
                Paragraph("<b>Fused Risk Score:</b>", body_style),
                Paragraph(f"<b>{risk_s} / 100 ({risk_lvl})</b>", body_style)
            ]
        ]
        ent_table = Table(ent_data, colWidths=[180, 350])
        ent_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
            ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(ent_table)
        story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 4. Associated Network Telemetry & IP Correlation
    # -------------------------------------------------------------
    story.append(Paragraph("2. Network Node Telemetry & IP Correlation", h2_style))
    ips = entity_details.get("associated_ips", []) if entity_details else []
    if ips:
        ip_rows = [[
            Paragraph("<b>Observed IP Address</b>", body_style),
            Paragraph("<b>Activity Count</b>", body_style),
            Paragraph("<b>Correlation Confidence</b>", body_style),
            Paragraph("<b>Attribution Qualifier</b>", body_style)
        ]]
        for item in ips[:6]:
            conf = item.get('correlation_confidence', 75.0)
            ip_rows.append([
                Paragraph(str(item.get('ip', 'N/A')), mono_style),
                Paragraph(str(item.get('tx_count', 1)), body_style),
                Paragraph(f"Correlation confidence: {conf}%", body_style),
                Paragraph("<font size=7 color='#64748b'>Synthetic Node</font>", body_style)
            ])
        ip_table = Table(ip_rows, colWidths=[140, 80, 170, 140])
        ip_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(ip_table)
    else:
        story.append(Paragraph("<i>No direct IP telemetry records attached.</i>", body_style))
        
    story.append(Spacer(1, 12))

    # -------------------------------------------------------------
    # 5. Linked Transactions Ledger
    # -------------------------------------------------------------
    story.append(Paragraph("3. Transaction Ledger & Anomaly Breakdown", h2_style))
    if transactions:
        tx_rows = [[
            Paragraph("<b>TXID</b>", body_style),
            Paragraph("<b>Counterparty</b>", body_style),
            Paragraph("<b>Amount (BTC)</b>", body_style),
            Paragraph("<b>Timestamp (UTC)</b>", body_style),
            Paragraph("<b>Risk Score</b>", body_style),
            Paragraph("<b>Typology</b>", body_style)
        ]]
        
        for tx in transactions[:12]:
            txid_short = tx.get("txid", "")[:12] + "..."
            cparty = tx.get("wallet_to", "")[:10] + "..." if tx.get("wallet_from") == case.get("target_entity") else tx.get("wallet_from", "")[:10] + "..."
            amt = f"{float(tx.get('amount', 0.0)):.4f}"
            t_stamp = tx.get("timestamp", "")[:19].replace("T", " ")
            r_score = f"{tx.get('risk_score', 0.0)} ({tx.get('risk_level', 'LOW')})"
            typ = tx.get("typology", "NORMAL")
            
            tx_rows.append([
                Paragraph(txid_short, mono_style),
                Paragraph(cparty, mono_style),
                Paragraph(amt, body_style),
                Paragraph(t_stamp, ParagraphStyle('Small', parent=body_style, fontSize=7.5)),
                Paragraph(r_score, body_style),
                Paragraph(f"<font size=7>{typ}</font>", body_style)
            ])
            
        tx_table = Table(tx_rows, colWidths=[95, 85, 75, 110, 85, 80])
        tx_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(tx_table)
    else:
        story.append(Paragraph("<i>No specific transactions linked to this docket.</i>", body_style))
        
    story.append(Spacer(1, 14))

    # -------------------------------------------------------------
    # 6. Investigator Notes & Chain of Custody
    # -------------------------------------------------------------
    story.append(Paragraph("4. Investigator Notes & Chain of Custody", h2_style))
    inv_notes = case.get("investigator_notes", "").strip() or "Standard forensic extraction conducted. Anomaly score and graph centrality calculated via BitTrace pipeline."
    story.append(Paragraph(inv_notes, body_style))
    story.append(Spacer(1, 15))
    
    sign_table = Table(
        [[
            Paragraph("<b>Investigating Officer Signature:</b><br/><br/>_______________________________<br/><font size=7 color='#64748b'>Analyst ID: INV-0492 / NTRO</font>", body_style),
            Paragraph("<b>Forensic Supervisor Approval:</b><br/><br/>_______________________________<br/><font size=7 color='#64748b'>Directorate of Blockchain Analytics</font>", body_style)
        ]],
        colWidths=[265, 265]
    )
    sign_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(sign_table)
    
    doc.build(story)
    return buffer.getvalue()
