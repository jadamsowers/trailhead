import React, { useMemo } from "react";
import "./TopoBackground.css";
import { noise2D } from "../../utils/noise";

interface Point {
  x: number;
  y: number;
}

// Helper to smooth a polyline using quadratic bezier curves
const getSmoothPath = (points: Point[], close: boolean = false) => {
  if (points.length < 2) return "";
  if (points.length === 2) {
    // For just 2 points, draw a simple line
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}${close ? " Z" : ""}`;
  }

  let d = `M ${points[0].x},${points[0].y}`;

  // Use quadratic bezier curves through all points
  // For each segment, use the midpoint as the end and the actual point as control
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    
    // Calculate midpoint
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    
    if (i === 0) {
      // First segment: line to first midpoint
      d += ` Q ${current.x},${current.y} ${midX},${midY}`;
    } else {
      // Use current point as control, midpoint as end
      d += ` Q ${current.x},${current.y} ${midX},${midY}`;
    }
  }
  
  // Handle the last point
  const lastPoint = points[points.length - 1];
  if (close && points.length > 2) {
    // Close the path smoothly back to start
    const firstPoint = points[0];
    const midX = (lastPoint.x + firstPoint.x) / 2;
    const midY = (lastPoint.y + firstPoint.y) / 2;
    d += ` Q ${lastPoint.x},${lastPoint.y} ${midX},${midY}`;
    d += ` Q ${firstPoint.x},${firstPoint.y} ${points[0].x},${points[0].y}`;
    d += " Z";
  } else {
    // End at the last point
    d += ` Q ${lastPoint.x},${lastPoint.y} ${lastPoint.x},${lastPoint.y}`;
  }

  return d;
};

// Stitch segments into polylines
const stitchSegments = (segments: { p1: Point; p2: Point }[]) => {
  const adj = new Map<string, Point[]>();
  
  segments.forEach(s => {
      const k1 = `${s.p1.x.toFixed(1)},${s.p1.y.toFixed(1)}`;
      const k2 = `${s.p2.x.toFixed(1)},${s.p2.y.toFixed(1)}`;
      if (!adj.has(k1)) adj.set(k1, []);
      if (!adj.has(k2)) adj.set(k2, []);
      adj.get(k1)?.push(s.p2);
      adj.get(k2)?.push(s.p1);
  });
  
  const visitedPoints = new Set<string>();
  const chains: Point[][] = [];
  
  // 1. Find open chains (start at endpoints)
  for (const [key, neighbors] of adj.entries()) {
      if (visitedPoints.has(key)) continue;
      // If degree is 1, it's an endpoint. Start here.
      if (neighbors.length === 1) {
          const chain: Point[] = [];
          let curr: Point | undefined = { x: parseFloat(key.split(',')[0]), y: parseFloat(key.split(',')[1]) };
          let currKey = key;
          
          while (curr) {
              chain.push(curr);
              visitedPoints.add(currKey);
              
              const n = adj.get(currKey);
              let next: Point | undefined = undefined;
              
              if (n) {
                  for (const p of n) {
                      const pk = `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                      if (!visitedPoints.has(pk)) {
                          next = p;
                          currKey = pk;
                          break;
                      }
                  }
              }
              curr = next;
          }
          chains.push(chain);
      }
  }
  
  // 2. Find closed loops (remaining unvisited points)
  for (const [key] of adj.entries()) {
      if (visitedPoints.has(key)) continue;
      // Start a loop
      const chain: Point[] = [];
      let curr: Point | undefined = { x: parseFloat(key.split(',')[0]), y: parseFloat(key.split(',')[1]) };
      let currKey = key;
      
      const startKey = key;
      
      while (curr) {
          chain.push(curr);
          visitedPoints.add(currKey);
          
          const n = adj.get(currKey);
          let next: Point | undefined = undefined;
          
          if (n) {
             for (const p of n) {
                  const pk = `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                  // Special case for closing loop
                  if (pk === startKey && chain.length > 2) {
                      // Closed loop
                      chain.push(p); 
                      curr = undefined; 
                      next = undefined;
                      break;
                  }
                  
                  if (!visitedPoints.has(pk)) {
                      next = p;
                      currKey = pk;
                      break;
                  }
             }
          }
          curr = next;
      }
      chains.push(chain);
  }
  
  return chains;
};

const LAKE_NAMES = [
  "Mirror Lake", "Crystal Lake", "Blue Basin", "Echo Pond", "Lost Lake",
  "Silver Mere", "Whispering Waters", "Deep Blue", "Serenity Lake", "Twin Lakes"
];

const MOUNTAIN_NAMES = [
  "Mt. Summit", "Eagle Peak", "Granite Ridge", "Thunder Mountain", "Lone Peak",
  "Bear Mountain", "Sunset Ridge", "Storm Peak", "Wildfire Mountain", "Cedar Peak",
  "Hawk Ridge", "Timber Peak", "Cascade Mountain", "Raven Peak", "Skyline Ridge"
];

const generateContours = (
  width: number,
  height: number,
  gridSize: number,
  contourThresholds: number[],
  riverThreshold: number
) => {
  const cols = Math.ceil(width / gridSize) + 1;
  const rows = Math.ceil(height / gridSize) + 1;
  const field: number[][] = [];
  const seed = Math.random() * 100;

  // 1. Generate scalar field
  for (let i = 0; i < cols; i++) {
    field[i] = [];
    for (let j = 0; j < rows; j++) {
      const x = i * 0.05; 
      const y = j * 0.05;
      field[i][j] = (noise2D(x, y, seed) + 1) / 2;
    }
  }

  // 2. Peaks
  const peaks: { x: number; y: number; height: number }[] = [];
  for (let i = 2; i < cols - 2; i++) {
    for (let j = 2; j < rows - 2; j++) {
      const val = field[i][j];
      if (val > 0.8) {
        let isPeak = true;
        for (let di = -2; di <= 2; di++) {
          for (let dj = -2; dj <= 2; dj++) {
            if (di === 0 && dj === 0) continue;
            if (field[i + di][j + dj] >= val) {
              isPeak = false;
              break;
            }
          }
          if (!isPeak) break;
        }
        if (isPeak) {
          peaks.push({ x: i * gridSize, y: j * gridSize, height: val });
        }
      }
    }
  }

  // 3. Marching Squares Segments
  const getSegmentsForThreshold = (threshold: number) => {
    const segments: { p1: Point; p2: Point }[] = [];
    
    for (let i = 0; i < cols - 1; i++) {
      for (let j = 0; j < rows - 1; j++) {
        const x = i * gridSize;
        const y = j * gridSize;

        const tl = field[i][j] >= threshold ? 8 : 0;
        const tr = field[i + 1][j] >= threshold ? 4 : 0;
        const br = field[i + 1][j + 1] >= threshold ? 2 : 0;
        const bl = field[i][j + 1] >= threshold ? 1 : 0;

        const state = tl | tr | br | bl;
        if (state === 0 || state === 15) continue;

        const a = field[i][j];
        const b = field[i + 1][j];
        const c = field[i + 1][j + 1];
        const d = field[i][j + 1];

        const lerp = (v0: number, v1: number, t: number) => (t - v0) / (v1 - v0);

        const top = { x: x + gridSize * lerp(a, b, threshold), y: y };
        const right = { x: x + gridSize, y: y + gridSize * lerp(b, c, threshold) };
        const bottom = { x: x + gridSize * lerp(d, c, threshold), y: y + gridSize };
        const left = { x: x, y: y + gridSize * lerp(a, d, threshold) };

        switch (state) {
          case 1: segments.push({ p1: left, p2: bottom }); break;
          case 2: segments.push({ p1: bottom, p2: right }); break;
          case 3: segments.push({ p1: left, p2: right }); break;
          case 4: segments.push({ p1: top, p2: right }); break;
          case 5: 
            segments.push({ p1: left, p2: top });
            segments.push({ p1: bottom, p2: right });
            break;
          case 6: segments.push({ p1: top, p2: bottom }); break;
          case 7: segments.push({ p1: left, p2: top }); break;
          case 8: segments.push({ p1: left, p2: top }); break;
          case 9: segments.push({ p1: top, p2: bottom }); break;
          case 10:
            segments.push({ p1: left, p2: bottom });
            segments.push({ p1: top, p2: right });
            break;
          case 11: segments.push({ p1: top, p2: right }); break;
          case 12: segments.push({ p1: left, p2: right }); break;
          case 13: segments.push({ p1: bottom, p2: right }); break;
          case 14: segments.push({ p1: left, p2: bottom }); break;
        }
      }
    }
    return segments;
  };

  // Generate smooth paths for contours
  const contourPaths = contourThresholds.map(t => {
      const segs = getSegmentsForThreshold(t);
      const chains = stitchSegments(segs);
      return chains.map(chain => getSmoothPath(chain)).join(" ");
  });

  // Rivers and Lakes
  const riverSegs = getSegmentsForThreshold(riverThreshold);
  const riverChains = stitchSegments(riverSegs);
  
  const lakes: { path: string; x: number; y: number; name: string }[] = [];
  const streams: string[] = []; // Dashed lines for streams
  
  riverChains.forEach(chain => {
      // Check if closed loop
      const start = chain[0];
      const end = chain[chain.length - 1];
      const isClosed = Math.abs(start.x - end.x) < 0.1 && Math.abs(start.y - end.y) < 0.1;
      
      const path = getSmoothPath(chain, isClosed);
      
      if (isClosed && chain.length > 10) { // Only treat large enough loops as lakes
          // Calculate centroid for label
          let cx = 0, cy = 0;
          chain.forEach(p => { cx += p.x; cy += p.y; });
          cx /= chain.length;
          cy /= chain.length;
          
          lakes.push({
              path,
              x: cx,
              y: cy,
              name: LAKE_NAMES[Math.floor(Math.random() * LAKE_NAMES.length)]
          });
      } else {
          // Open paths are streams
          streams.push(path);
      }
  });

  return { contourPaths, streams, lakes, peaks };
};

const TopoBackground: React.FC<{ gridSize?: number; width?: number; height?: number }> = ({
  gridSize = 5, // Very fine resolution to eliminate artifacts
  width = 1920,
  height = 1080,
}) => {
  const { contourPaths, streams, lakes, peaks } = useMemo(() => {
    const contourThresholds = Array.from({ length: 12 }, (_, i) => 0.25 + i * 0.05);
    const riverThreshold = 0.22;
    return generateContours(width, height, gridSize, contourThresholds, riverThreshold);
  }, [width, height, gridSize]);

  return (
    <div className="topo-bg fixed inset-0 w-screen h-screen z-[-1] overflow-hidden pointer-events-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid slice"
        className="topo-svg w-full h-full"
      >
        {/* Streams (dashed lines in valleys) */}
        {streams.map((streamPath, i) => (
          <path
            key={i}
            d={streamPath}
            fill="none"
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        ))}

        {/* Lakes (Closed loops) */}
        {lakes.map((lake, i) => (
          <g key={i}>
            <path
              d={lake.path}
              className="topo-lake"
              fill="rgba(59, 130, 246, 0.15)"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeWidth={1}
            />
            <text
              x={lake.x}
              y={lake.y}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ 
                fontSize: "11px", 
                fontFamily: "serif", 
                fontStyle: "italic", 
                fill: "rgba(59, 130, 246, 0.9)",
                fontWeight: 500
              }}
            >
              {lake.name}
            </text>
          </g>
        ))}

        {/* Contours */}
        {contourPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            className="topo-path"
            style={{
              strokeOpacity: i % 5 === 0 ? 0.15 : 0.05,
              strokeWidth: i % 5 === 0 ? 1.5 : 0.5,
            }}
            fill="none"
          />
        ))}

        {/* Peaks */}
        {peaks.map((peak, i) => (
          <g key={i}>
            <circle
              cx={peak.x}
              cy={peak.y}
              r="2.5"
              fill="rgba(0,0,0,0.6)"
            />
            <text
              x={peak.x}
              y={peak.y - 10}
              textAnchor="middle"
              style={{ 
                fontSize: "11px", 
                fontFamily: "serif", 
                fontStyle: "italic",
                fill: "var(--text-primary)",
                opacity: 0.8
              }}
            >
              {MOUNTAIN_NAMES[i % MOUNTAIN_NAMES.length]}
            </text>
            <text
              x={peak.x}
              y={peak.y + 14}
              textAnchor="middle"
              style={{ 
                fontSize: "9px", 
                fontFamily: "monospace",
                fill: "var(--text-secondary)",
                opacity: 0.7
              }}
            >
              ▲ {Math.round(peak.height * 2000)}m
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default TopoBackground;
