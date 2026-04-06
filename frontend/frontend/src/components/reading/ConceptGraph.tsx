import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function ConceptGraph({ graph, height = 260 }) {
  const fgRef = useRef(null);
  const [selected, setSelected] = useState(null);

  const data = useMemo(() => {
    const nodes = (graph?.nodes || []).map((n) => ({ id: n.id, type: n.type || 'concept' }));
    const links = (graph?.edges || []).map((e) => ({
      source: e.source,
      target: e.target,
      relation: e.relation || 'related to',
    }));
    return { nodes, links };
  }, [graph]);

  useEffect(() => {
    if (!fgRef.current) return;
    try {
      fgRef.current.zoomToFit(400, 40);
    } catch {
      // ignore
    }
  }, [data.nodes.length, data.links.length]);

  if (!data.nodes.length) {
    return (
      <div className="text-xs text-charcoal/50">
        No concepts detected yet. Try a longer paragraph.
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-moss/10 overflow-hidden bg-white">
        <ForceGraph2D
          ref={fgRef}
          graphData={data}
          height={height}
          backgroundColor="rgba(255,255,255,1)"
          nodeLabel={(n) => n.id}
          linkLabel={(l) => l.relation}
          nodeRelSize={5}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.id;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.fillStyle = selected?.id === node.id ? '#2E4036' : 'rgba(46,64,54,0.8)';
            ctx.beginPath();
            ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.fillText(label, node.x + 6, node.y + 4);
          }}
          linkColor={() => 'rgba(185,124,93,0.55)'}
          onNodeClick={(node) => setSelected(node)}
        />
      </div>

      {selected ? (
        <div className="mt-3 rounded-2xl bg-moss/[0.03] border border-moss/10 p-4">
          <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-1">Selected concept</p>
          <p className="text-sm text-charcoal/80">{selected.id}</p>
        </div>
      ) : null}
    </div>
  );
}

