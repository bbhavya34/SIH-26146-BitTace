import React, { useState, useEffect, useRef } from 'react';
import {
  Share2,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldAlert,
  Radio,
  Layers,
  Search,
  Eye,
  Info
} from 'lucide-react';
import { fetchGraph, fetchWalletDetail } from '../services/api';
import { GraphData, GraphNode, GraphEdge, Wallet } from '../types';

interface GraphPageProps {
  initialFocusId?: string | null;
  onOpenEntity: (type: 'TRANSACTION' | 'WALLET' | 'LEAD', item: any) => void;
}

export const GraphPage: React.FC<GraphPageProps> = ({
  initialFocusId,
  onOpenEntity,
}) => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [], total_nodes: 0, total_edges: 0 });
  const [loading, setLoading] = useState(true);
  const [minRisk, setMinRisk] = useState(0);
  const [typology, setTypology] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState(initialFocusId || '');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Canvas ref & transform state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const nodesRef = useRef<GraphNode[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await fetchGraph({
        min_risk: minRisk,
        max_nodes: 120,
        typology: typology !== 'ALL' ? typology : undefined,
      });
      
      // Initialize physics coordinates in circle/grid layout
      const width = 1000;
      const height = 700;
      const initializedNodes = data.nodes.map((node, i) => {
        const angle = (i / data.nodes.length) * 2 * Math.PI;
        const radius = 220 + (i % 3) * 60;
        return {
          ...node,
          x: width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
          y: height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
          vx: 0,
          vy: 0,
        };
      });

      nodesRef.current = initializedNodes;
      setGraphData({ ...data, nodes: initializedNodes });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [minRisk, typology]);

  // Physics Simulation Step
  useEffect(() => {
    if (graphData.nodes.length === 0) return;

    let iterations = 0;
    const maxIterations = 200;

    const simulate = () => {
      const nodes = nodesRef.current;
      const edges = graphData.edges;
      if (!nodes || nodes.length === 0) return;

      const nodeMap = new Map<string, GraphNode>();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      // 1. Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = (n2.x || 0) - (n1.x || 0);
          const dy = (n2.y || 0) - (n1.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) {
            const force = (180 - dist) / (dist * 12);
            n1.vx = (n1.vx || 0) - dx * force;
            n1.vy = (n1.vy || 0) - dy * force;
            n2.vx = (n2.vx || 0) + dx * force;
            n2.vy = (n2.vy || 0) + dy * force;
          }
        }
      }

      // 2. Attraction along edges
      for (const edge of edges) {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (src && tgt) {
          const dx = (tgt.x || 0) - (src.x || 0);
          const dy = (tgt.y || 0) - (src.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const desiredDist = edge.type === 'IP_OBSERVATION' ? 60 : 110;
          const force = (dist - desiredDist) * 0.015;
          src.vx = (src.vx || 0) + (dx / dist) * force;
          src.vy = (src.vy || 0) + (dy / dist) * force;
          tgt.vx = (tgt.vx || 0) - (dx / dist) * force;
          tgt.vy = (tgt.vy || 0) - (dy / dist) * force;
        }
      }

      // 3. Center gravity & damping
      for (const node of nodes) {
        const cdx = 500 - (node.x || 500);
        const cdy = 350 - (node.y || 350);
        node.vx = ((node.vx || 0) + cdx * 0.002) * 0.85;
        node.vy = ((node.vy || 0) + cdy * 0.002) * 0.85;
        node.x = (node.x || 500) + (node.vx || 0);
        node.y = (node.y || 350) + (node.vy || 0);
      }

      draw();

      iterations++;
      if (iterations < maxIterations) {
        animationFrameRef.current = requestAnimationFrame(simulate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [graphData]);

  // Canvas Rendering
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const { x, y, scale } = transformRef.current;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const nodes = nodesRef.current;
    const nodeMap = new Map<string, GraphNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // Draw Edges
    for (const edge of graphData.edges) {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) continue;

      ctx.beginPath();
      ctx.moveTo(src.x || 0, src.y || 0);
      ctx.lineTo(tgt.x || 0, tgt.y || 0);

      if (edge.type === 'IP_OBSERVATION') {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
      } else {
        ctx.setLineDash([]);
        if (edge.risk_score >= 75) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.lineWidth = 2.2;
        } else if (edge.risk_score >= 50) {
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
          ctx.lineWidth = 1.6;
        } else {
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
          ctx.lineWidth = 1;
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Arrow on transfers
      if (edge.type === 'TRANSFER' && src.x && src.y && tgt.x && tgt.y) {
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 25) {
          const midX = (src.x + tgt.x) / 2;
          const midY = (src.y + tgt.y) / 2;
          const angle = Math.atan2(dy, dx);
          ctx.save();
          ctx.translate(midX, midY);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-6, -3);
          ctx.lineTo(-6, 3);
          ctx.closePath();
          ctx.fillStyle = edge.risk_score >= 75 ? '#ef4444' : '#64748b';
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // Draw Nodes
    for (const node of nodes) {
      if (!node.x || !node.y) continue;

      const isMatch = searchQuery && node.id.toLowerCase().includes(searchQuery.toLowerCase());
      const isSel = selectedNode && selectedNode.id === node.id;

      // Glow effect for high risk or selected
      if (isSel || isMatch || node.risk_score >= 75) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.type === 'IP' ? 14 : 18, 0, 2 * Math.PI);
        ctx.fillStyle = isSel ? 'rgba(6, 182, 212, 0.4)' : node.risk_score >= 75 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)';
        ctx.fill();
      }

      ctx.beginPath();
      if (node.type === 'IP') {
        // IP Node: Diamond shape
        const size = 7;
        ctx.moveTo(node.x, node.y - size);
        ctx.lineTo(node.x + size, node.y);
        ctx.lineTo(node.x, node.y + size);
        ctx.lineTo(node.x - size, node.y);
        ctx.closePath();
        ctx.fillStyle = '#06b6d4';
      } else {
        // Wallet Node: Circle
        const radius = Math.min(13, Math.max(6, 6 + (node.degree || 1) * 0.7));
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        
        if (node.risk_score >= 75) {
          ctx.fillStyle = '#ef4444';
        } else if (node.risk_score >= 50) {
          ctx.fillStyle = '#f97316';
        } else if (node.risk_score >= 30) {
          ctx.fillStyle = '#eab308';
        } else {
          ctx.fillStyle = '#10b981';
        }
      }

      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Node Label
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + (node.type === 'IP' ? 16 : 18));
    }

    ctx.restore();
  };

  // Mouse drag & zoom handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = (e.clientX - rect.left - transformRef.current.x) / transformRef.current.scale;
    const clickY = (e.clientY - rect.top - transformRef.current.y) / transformRef.current.scale;

    // Check if node clicked
    let clickedNode: GraphNode | null = null;
    for (const node of nodesRef.current) {
      if (node.x && node.y) {
        const dist = Math.sqrt((node.x - clickX) ** 2 + (node.y - clickY) ** 2);
        if (dist <= 15) {
          clickedNode = node;
          break;
        }
      }
    }

    if (clickedNode) {
      setSelectedNode(clickedNode);
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    transformRef.current.x = e.clientX - dragStartRef.current.x;
    transformRef.current.y = e.clientY - dragStartRef.current.y;
    draw();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleZoom = (delta: number) => {
    transformRef.current.scale = Math.min(3.0, Math.max(0.3, transformRef.current.scale + delta));
    draw();
  };

  const handleResetView = () => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
    draw();
  };

  const handleInspectSelected = async () => {
    if (!selectedNode) return;
    if (selectedNode.type === 'WALLET') {
      try {
        const fullWallet = await fetchWalletDetail(selectedNode.id);
        onOpenEntity('WALLET', fullWallet);
      } catch (e) {
        onOpenEntity('WALLET', { address: selectedNode.id, risk_score: selectedNode.risk_score, risk_level: selectedNode.risk_level });
      }
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Network Graph Link Analysis</h2>
          <p className="text-xs text-soc-400 font-mono mt-0.5">
            Interactive multi-hop topological graph rendering Bitcoin addresses, transfer volumes, and correlated IP nodes.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs font-mono bg-soc-900 px-3 py-1.5 rounded-md border border-soc-800">
          <span className="flex items-center space-x-1 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Critical</span>
          </span>
          <span className="flex items-center space-x-1 text-orange-400">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>High</span>
          </span>
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Low</span>
          </span>
          <span className="flex items-center space-x-1 text-cyan-400">
            <span className="w-2 h-2 rotate-45 bg-cyan-400" />
            <span>IP Node</span>
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="soc-card p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Typology Filter */}
          <select
            value={typology}
            onChange={(e) => setTypology(e.target.value)}
            className="soc-input text-xs font-mono py-1.5"
          >
            <option value="ALL">All Typologies</option>
            <option value="PEEL_CHAIN">Peel Chains</option>
            <option value="FAN_IN_STRUCTURING">Fan-In Structuring</option>
            <option value="FAN_OUT_LAYERING">Fan-Out Layering</option>
            <option value="RAPID_BURST">Rapid Bursts</option>
          </select>

          {/* Min Threat Slider */}
          <div className="flex items-center space-x-2 text-xs font-mono text-soc-300">
            <span>Min Risk:</span>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minRisk}
              onChange={(e) => setMinRisk(Number(e.target.value))}
              className="accent-cyan-500 cursor-pointer"
            />
            <span className="text-cyan-400 font-bold w-6">{minRisk}%</span>
          </div>

          {/* Search Node */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                draw();
              }}
              placeholder="Filter node in graph..."
              className="soc-input text-xs font-mono py-1.5 pl-7 w-48"
            />
            <Search className="w-3.5 h-3.5 text-soc-400 absolute left-2 top-2.5" />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1 bg-soc-950 p-1 rounded border border-soc-800">
          <button
            onClick={() => handleZoom(0.2)}
            className="p-1.5 rounded hover:bg-soc-800 text-soc-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.2)}
            className="p-1.5 rounded hover:bg-soc-800 text-soc-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded hover:bg-soc-800 text-soc-300 hover:text-white"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Graph Canvas Container */}
      <div className="relative soc-card overflow-hidden h-[600px] bg-soc-950 border-soc-800 flex items-center justify-center">
        {loading && (
          <div className="absolute z-20 text-xs font-mono text-cyan-400 animate-pulse bg-soc-900/80 px-4 py-2 rounded border border-cyan-800">
            Constructing graph network and computing spring layout...
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Selected Node Inspector Overlay Card */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 z-20 w-80 bg-soc-900/95 border border-soc-700 rounded-lg p-4 shadow-2xl backdrop-blur space-y-2.5 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-soc-400">Node Inspector</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                selectedNode.risk_score >= 75 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}>
                {selectedNode.risk_score}% RISK
              </span>
            </div>

            <div>
              <div className="text-xs font-mono text-cyan-300 break-all font-semibold">
                {selectedNode.id}
              </div>
              <div className="text-[10px] text-soc-400 font-mono mt-0.5">
                Type: {selectedNode.type} • Degree: {selectedNode.degree}
              </div>
            </div>

            <button
              onClick={handleInspectSelected}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded bg-soc-800 hover:bg-soc-700 text-white text-xs font-medium border border-soc-700 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspect Full Profile</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
