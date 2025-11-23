import React, { useEffect, useRef } from 'react';

interface TopographicBackgroundProps {
    opacity?: number;
    lineColor?: string;
    backgroundColor?: string;
}

const TopographicBackground: React.FC<TopographicBackgroundProps> = ({
    opacity = 0.15,
    lineColor = 'var(--sa-dark-blue)',
    backgroundColor = 'var(--bg-secondary)'
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = svgRef.current;
        const width = window.innerWidth * 1.5; // Extend for panning
        const height = window.innerHeight * 1.5;

        // Set SVG dimensions
        svg.setAttribute('width', width.toString());
        svg.setAttribute('height', height.toString());
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Perlin-like noise function for terrain
        const noise = (x: number, y: number, seed: number) => {
            const X = Math.floor(x) & 255;
            const Y = Math.floor(y) & 255;
            const hash = (X * 374761393 + Y * 668265263 + seed) & 0x7fffffff;
            return (hash / 0x7fffffff) * 2 - 1;
        };

        const smoothNoise = (x: number, y: number, seed: number) => {
            const intX = Math.floor(x);
            const intY = Math.floor(y);
            const fracX = x - intX;
            const fracY = y - intY;

            const v1 = noise(intX, intY, seed);
            const v2 = noise(intX + 1, intY, seed);
            const v3 = noise(intX, intY + 1, seed);
            const v4 = noise(intX + 1, intY + 1, seed);

            const i1 = v1 * (1 - fracX) + v2 * fracX;
            const i2 = v3 * (1 - fracX) + v4 * fracX;

            return i1 * (1 - fracY) + i2 * fracY;
        };

        const getElevation = (x: number, y: number) => {
            let elevation = 0;
            let amplitude = 1;
            let frequency = 0.003;

            // Multiple octaves for realistic terrain
            for (let i = 0; i < 4; i++) {
                elevation += smoothNoise(x * frequency, y * frequency, i * 1000) * amplitude;
                amplitude *= 0.5;
                frequency *= 2;
            }

            return elevation;
        };

        // Catmull-Rom spline for smooth curves
        const catmullRomToBezier = (points: Array<{x: number, y: number}>, closed: boolean) => {
            if (points.length < 2) return '';

            const pts = closed ? [...points, points[0], points[1]] : points;
            let path = `M ${pts[0].x} ${pts[0].y}`;

            for (let i = 0; i < pts.length - 1; i++) {
                const p0 = pts[Math.max(0, i - 1)];
                const p1 = pts[i];
                const p2 = pts[i + 1];
                const p3 = pts[Math.min(pts.length - 1, i + 2)];

                // Calculate control points for cubic Bezier
                const tension = 0.5;
                const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
                const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
                const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
                const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

                path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
            }

            if (closed) {
                path += ' Z';
            }

            return path;
        };

        // Generate contour lines at specific elevations
        const generateContourLines = () => {
            const contours: string[] = [];
            const elevationLevels = 12;
            const step = 2 / elevationLevels;
            const resolution = 18;

            for (let level = -1; level <= 1; level += step) {
                // Create elevation grid
                const gridWidth = Math.ceil(width / resolution) + 1;
                const gridHeight = Math.ceil(height / resolution) + 1;
                const grid: number[][] = [];

                for (let gy = 0; gy < gridHeight; gy++) {
                    grid[gy] = [];
                    for (let gx = 0; gx < gridWidth; gx++) {
                        grid[gy][gx] = getElevation(gx * resolution, gy * resolution);
                    }
                }

                // Find contour points using marching squares
                const contourPoints: Array<{x: number, y: number, gx: number, gy: number}> = [];

                for (let gy = 0; gy < gridHeight - 1; gy++) {
                    for (let gx = 0; gx < gridWidth - 1; gx++) {
                        const x = gx * resolution;
                        const y = gy * resolution;

                        const e1 = grid[gy][gx];
                        const e2 = grid[gy][gx + 1];
                        const e3 = grid[gy + 1][gx + 1];
                        const e4 = grid[gy + 1][gx];

                        // Calculate marching squares case
                        let caseValue = 0;
                        if (e1 > level) caseValue |= 1;
                        if (e2 > level) caseValue |= 2;
                        if (e3 > level) caseValue |= 4;
                        if (e4 > level) caseValue |= 8;

                        // Skip empty or full cells
                        if (caseValue === 0 || caseValue === 15) continue;

                        // Interpolate edge crossings
                        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
                        
                        // Top edge
                        if ((caseValue & 3) === 1 || (caseValue & 3) === 2) {
                            const t = (level - e1) / (e2 - e1);
                            contourPoints.push({x: lerp(x, x + resolution, t), y, gx, gy});
                        }
                        // Right edge
                        if ((caseValue & 6) === 2 || (caseValue & 6) === 4) {
                            const t = (level - e2) / (e3 - e2);
                            contourPoints.push({x: x + resolution, y: lerp(y, y + resolution, t), gx, gy});
                        }
                        // Bottom edge
                        if ((caseValue & 12) === 4 || (caseValue & 12) === 8) {
                            const t = (level - e4) / (e3 - e4);
                            contourPoints.push({x: lerp(x, x + resolution, t), y: y + resolution, gx, gy});
                        }
                        // Left edge
                        if ((caseValue & 9) === 1 || (caseValue & 9) === 8) {
                            const t = (level - e1) / (e4 - e1);
                            contourPoints.push({x, y: lerp(y, y + resolution, t), gx, gy});
                        }
                    }
                }

                // Build continuous paths
                if (contourPoints.length > 3) {
                    const used = new Set<number>();
                    const paths: Array<{x: number, y: number}[]> = [];

                    for (let i = 0; i < contourPoints.length; i++) {
                        if (used.has(i)) continue;

                        const path: Array<{x: number, y: number}> = [contourPoints[i]];
                        used.add(i);

                        // Build path by finding nearest neighbors
                        let searching = true;
                        const maxDist = resolution * 1.8;

                        while (searching && path.length < 500) {
                            searching = false;
                            const last = path[path.length - 1];
                            let closestIdx = -1;
                            let closestDist = maxDist;

                            // Look for closest unused point
                            for (let j = 0; j < contourPoints.length; j++) {
                                if (used.has(j)) continue;
                                const dx = contourPoints[j].x - last.x;
                                const dy = contourPoints[j].y - last.y;
                                const dist = Math.sqrt(dx * dx + dy * dy);

                                if (dist < closestDist) {
                                    closestDist = dist;
                                    closestIdx = j;
                                }
                            }

                            if (closestIdx >= 0) {
                                path.push(contourPoints[closestIdx]);
                                used.add(closestIdx);
                                searching = true;
                            }
                        }

                        // Check if path closes (forms a loop)
                        if (path.length > 8) {
                            const first = path[0];
                            const last = path[path.length - 1];
                            const dx = last.x - first.x;
                            const dy = last.y - first.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            const isClosed = dist < resolution * 2;

                            // Simplify path - remove points that are too close
                            const simplified: Array<{x: number, y: number}> = [path[0]];
                            for (let j = 1; j < path.length; j++) {
                                const prev = simplified[simplified.length - 1];
                                const curr = path[j];
                                const dx = curr.x - prev.x;
                                const dy = curr.y - prev.y;
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                if (dist > resolution * 0.5) {
                                    simplified.push(curr);
                                }
                            }

                            if (simplified.length > 4) {
                                const smoothPath = catmullRomToBezier(simplified, isClosed);
                                if (smoothPath) {
                                    contours.push(smoothPath);
                                }
                            }
                        }
                    }
                }
            }

            return contours;
        };

        // Create contour lines
        const paths = generateContourLines();
        const pathElements: SVGPathElement[] = [];

        paths.forEach((pathData) => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', lineColor);
            path.setAttribute('stroke-width', '1.5');
            path.setAttribute('opacity', opacity.toString());
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            
            svg.appendChild(path);
            pathElements.push(path);
        });

        // Handle window resize
        const handleResize = () => {
            const newWidth = window.innerWidth * 1.5;
            const newHeight = window.innerHeight * 1.5;
            svg.setAttribute('width', newWidth.toString());
            svg.setAttribute('height', newHeight.toString());
            svg.setAttribute('viewBox', `0 0 ${newWidth} ${newHeight}`);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [lineColor, opacity]);

    return (
        <>
            <style>{`
                @keyframes topoPan {
                    0% {
                        transform: translate(0, 0);
                    }
                    100% {
                        transform: translate(-25%, -25%);
                    }
                }
            `}</style>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: -1,
                    backgroundColor: backgroundColor,
                    overflow: 'hidden'
                }}
            >
                <svg
                    ref={svgRef}
                    style={{
                        position: 'absolute',
                        top: '-25%',
                        left: '-25%',
                        width: '150%',
                        height: '150%',
                        animation: 'topoPan 120s linear infinite'
                    }}
                >
                    <defs>
                        {/* Scouting America gradient: Dark Blue to Pale Blue to Tan */}
                        <linearGradient id="topoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: 'rgba(0, 51, 102, 0.2)', stopOpacity: 1 }} />
                            <stop offset="50%" style={{ stopColor: 'rgba(154, 179, 213, 0.15)', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: 'rgba(173, 157, 123, 0.18)', stopOpacity: 1 }} />
                        </linearGradient>
                        <radialGradient id="topoRadialGradient" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" style={{ stopColor: 'rgba(233, 233, 228, 0.5)', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: 'rgba(233, 233, 228, 0)', stopOpacity: 1 }} />
                        </radialGradient>
                    </defs>
                </svg>
                {/* Scouting America gradient overlay: Dark Blue to Pale Blue to Tan */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(0, 51, 102, 0.25) 0%, rgba(154, 179, 213, 0.15) 40%, rgba(233, 233, 228, 0) 60%, rgba(173, 157, 123, 0.2) 100%)',
                        pointerEvents: 'none'
                    }}
                />
                {/* Radial gradient for depth with Scouting America Light Tan */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle at 30% 30%, rgba(233, 233, 228, 0.6) 0%, rgba(233, 233, 228, 0) 60%)',
                        pointerEvents: 'none'
                    }}
                />
            </div>
        </>
    );
};

export default TopographicBackground;