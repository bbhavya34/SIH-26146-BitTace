"""
Synthetic Ground-Truth Bitcoin Transaction Dataset Generator for BitTrace
Generates realistic Bitcoin transactions with explicit, labeled money-laundering typologies
(Peel Chains, Fan-In Structuring, Fan-Out Layering, Rapid Bursts, Normal Baseline).
"""
import random
import hashlib
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any

def _generate_txid(seed_str: str) -> str:
    return hashlib.sha256(f"{seed_str}_{random.random()}".encode()).hexdigest()

def _generate_btc_address(prefix: str = "bc1q") -> str:
    chars = "023456789acdefghjklmnpqrstuvwxyz"
    body = "".join(random.choices(chars, k=38))
    return f"{prefix}{body}"

def _generate_legacy_address() -> str:
    chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    return "1" + "".join(random.choices(chars, k=33))

def _generate_ip(subnet_prefix: str = None) -> str:
    if subnet_prefix:
        return f"{subnet_prefix}.{random.randint(2, 254)}"
    return f"{random.randint(11, 210)}.{random.randint(10, 250)}.{random.randint(1, 254)}.{random.randint(2, 254)}"

def generate_synthetic_transactions(base_count: int = 150) -> List[Dict[str, Any]]:
    random.seed(42)  # Deterministic seed for reproducible baseline
    transactions = []
    
    start_time = datetime.utcnow() - timedelta(days=2)
    
    # -------------------------------------------------------------
    # Typology 1: PEEL CHAIN (Hop-by-hop peeling)
    # Origin wallet peels small amounts off a 25.0 BTC fund across 7 hops
    # -------------------------------------------------------------
    peel_origin = "bc1q9x8w7v6u5t4s3r2q1p0o9n8m7l6k5j4h3g2f1"
    current_wallet = peel_origin
    remaining_balance = 24.85
    peel_ip_pool = ["185.220.101.5", "185.220.101.6", "185.220.101.7"]  # Tor / VPN proxy cluster
    peel_time = start_time + timedelta(hours=3)
    
    for hop in range(1, 8):
        peel_amount = round(random.uniform(0.12, 0.45), 4)
        merchant_dest = _generate_btc_address()
        next_hop_wallet = _generate_btc_address() if hop < 7 else "bc1qpeeldestinationterminal99999999999999"
        
        tx_time = peel_time + timedelta(minutes=hop * 18 + random.randint(1, 5))
        txid = _generate_txid(f"peel_hop_{hop}")
        
        # Transaction represents the peel output
        transactions.append({
            "txid": txid,
            "wallet_from": current_wallet,
            "wallet_to": next_hop_wallet,
            "amount": round(remaining_balance - peel_amount, 4),
            "timestamp": tx_time.isoformat() + "Z",
            "ip": random.choice(peel_ip_pool),
            "port": 8333,
            "typology": "PEEL_CHAIN",
            "ground_truth_label": "Suspicious: Peel Chain Forwarding",
            "metadata": {"hop": hop, "peeled_amount": peel_amount, "next_target": next_hop_wallet}
        })
        
        # Also log the peeled payout transaction
        peel_payout_txid = _generate_txid(f"peel_payout_{hop}")
        transactions.append({
            "txid": peel_payout_txid,
            "wallet_from": current_wallet,
            "wallet_to": merchant_dest,
            "amount": peel_amount,
            "timestamp": (tx_time + timedelta(seconds=2)).isoformat() + "Z",
            "ip": random.choice(peel_ip_pool),
            "port": 8333,
            "typology": "PEEL_CHAIN",
            "ground_truth_label": "Suspicious: Peeled Payout",
            "metadata": {"hop": hop, "type": "peel_payout"}
        })
        
        remaining_balance = round(remaining_balance - peel_amount, 4)
        current_wallet = next_hop_wallet

    # -------------------------------------------------------------
    # Typology 2: FAN-IN STRUCTURING / SMURFING
    # 9 smurf burner wallets funneling amounts (0.91 - 0.98 BTC, just under 1.0 threshold)
    # into a single aggregator wallet within a tight 35-minute window
    # -------------------------------------------------------------
    aggregator_wallet = "bc1qaggregator777targetmasterconsolidate"
    smurf_time = start_time + timedelta(hours=14)
    smurf_ips = ["194.26.29.11", "194.26.29.12", "194.26.29.13"] # Shared VPN subnet
    
    for smurf_idx in range(1, 10):
        smurf_wallet = _generate_btc_address(prefix="bc1qsmurf")
        structured_amount = round(random.uniform(0.915, 0.985), 4) # Structuring below 1.0 BTC
        tx_time = smurf_time + timedelta(minutes=smurf_idx * 3 + random.randint(0, 2))
        
        transactions.append({
            "txid": _generate_txid(f"smurf_{smurf_idx}"),
            "wallet_from": smurf_wallet,
            "wallet_to": aggregator_wallet,
            "amount": structured_amount,
            "timestamp": tx_time.isoformat() + "Z",
            "ip": random.choice(smurf_ips),
            "port": 8333,
            "typology": "FAN_IN_STRUCTURING",
            "ground_truth_label": "Suspicious: Sub-threshold Structuring (Smurfing)",
            "metadata": {"smurf_index": smurf_idx, "target": aggregator_wallet}
        })

    # -------------------------------------------------------------
    # Typology 3: FAN-OUT LAYERING (Rapid Dispersal)
    # Aggregator wallet disperses consolidated 8.5 BTC to 12 mule addresses
    # -------------------------------------------------------------
    fanout_origin = aggregator_wallet
    fanout_time = smurf_time + timedelta(hours=1, minutes=15)
    
    for mule_idx in range(1, 13):
        mule_wallet = _generate_btc_address(prefix="bc1qmule")
        split_amount = round(random.uniform(0.65, 0.75), 4)
        tx_time = fanout_time + timedelta(seconds=mule_idx * 45)
        
        transactions.append({
            "txid": _generate_txid(f"fanout_{mule_idx}"),
            "wallet_from": fanout_origin,
            "wallet_to": mule_wallet,
            "amount": split_amount,
            "timestamp": tx_time.isoformat() + "Z",
            "ip": "194.26.29.11",
            "port": 8333,
            "typology": "FAN_OUT_LAYERING",
            "ground_truth_label": "Suspicious: High Fan-Out Layering Dispersal",
            "metadata": {"mule_index": mule_idx}
        })

    # -------------------------------------------------------------
    # Typology 4: HIGH-VELOCITY BURST / MIXER INTERACTION
    # Two nodes rapidly cycling 14 micro-transactions in under 3 minutes
    # -------------------------------------------------------------
    burst_wallet_a = "bc1qrapidmixerburstsource000111aaabbb"
    burst_wallet_b = "bc1qrapidmixerbursttarget000222cccddd"
    burst_time = start_time + timedelta(hours=22)
    
    for burst_idx in range(1, 15):
        is_a_to_b = (burst_idx % 2 != 0)
        from_w = burst_wallet_a if is_a_to_b else burst_wallet_b
        to_w = burst_wallet_b if is_a_to_b else burst_wallet_a
        burst_amount = round(random.uniform(1.8, 3.2), 3)
        tx_time = burst_time + timedelta(seconds=burst_idx * 12)
        
        transactions.append({
            "txid": _generate_txid(f"burst_{burst_idx}"),
            "wallet_from": from_w,
            "wallet_to": to_w,
            "amount": burst_amount,
            "timestamp": tx_time.isoformat() + "Z",
            "ip": _generate_ip("198.51.100"), # Fast rotating proxy
            "port": 8333,
            "typology": "RAPID_BURST",
            "ground_truth_label": "Suspicious: High-Velocity Rapid Cycling Burst",
            "metadata": {"burst_step": burst_idx}
        })

    # -------------------------------------------------------------
    # Baseline Normal Transactions (Randomized Peer-to-Peer, Merchant, Exchange)
    # -------------------------------------------------------------
    legit_wallets = [_generate_btc_address() for _ in range(40)] + [_generate_legacy_address() for _ in range(15)]
    
    for i in range(base_count):
        w_from, w_to = random.sample(legit_wallets, 2)
        # Normal distribution of amounts with median around 0.08 BTC
        amount = round(random.expovariate(1.0 / 0.15) + 0.005, 4)
        amount = min(amount, 8.5) # Cap outliers in baseline
        
        offset_seconds = random.randint(0, int(timedelta(days=2).total_seconds()))
        tx_time = start_time + timedelta(seconds=offset_seconds)
        
        transactions.append({
            "txid": _generate_txid(f"baseline_{i}"),
            "wallet_from": w_from,
            "wallet_to": w_to,
            "amount": amount,
            "timestamp": tx_time.isoformat() + "Z",
            "ip": _generate_ip(),
            "port": 8333,
            "typology": "NORMAL",
            "ground_truth_label": "Normal: Baseline Peer Transaction",
            "metadata": {}
        })

    # Sort all transactions chronologically
    transactions.sort(key=lambda x: x["timestamp"])
    return transactions
