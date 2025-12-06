import React, { useEffect, useRef, useState } from "react";
import { createNoise2D } from "simplex-noise";
import { contours } from "d3-contour";
import * as d3 from "d3";

interface TopographicBackgroundProps {
  opacity?: number;
  lineColor?: string;
  backgroundColor?: string;
}

const TopographicBackground: React.FC<TopographicBackgroundProps> = ({
  opacity = 0.15,
  lineColor = "var(--sa-dark-blue)",
  backgroundColor = "var(--bg-secondary)",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const htmlElement = document.documentElement;
      const isDark =
        htmlElement.getAttribute("data-theme") === "dark" ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", checkDarkMode);
    };
  }, []);

  // Topo generation
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;

    // Clear old paths
    svg.innerHTML = "";

    const width = window.innerWidth * 1.5;
    const height = window.innerHeight * 1.5;

    svg.setAttribute("width", width.toString());
    svg.setAttribute("height", height.toString());
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    // Create simplex noise instance
    const noise2D = createNoise2D();

    // Build dense elevation grid
    const resolution = 6; // Much finer, more organic contours
    const gridWidth = Math.ceil(width / resolution);
    const gridHeight = Math.ceil(height / resolution);

    const values = new Array(gridWidth * gridHeight);

    let index = 0;
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const nx = x / gridWidth;
        const ny = y / gridHeight;

        // Multi-octave simplex terrain
        const elevation =
          1.2 * noise2D(nx * 1.2, ny * 1.2) +
          0.6 * noise2D(nx * 2.4, ny * 2.4) +
          0.3 * noise2D(nx * 4.8, ny * 4.8);

        values[index++] = elevation;
      }
    }

    // Generate contour lines
    const contourGen = contours()
      .size([gridWidth, gridHeight])
      .smooth(true)
      .thresholds(12);

    const contourList = contourGen(values);

    // Chaikin smoothing
    const chaikin = (pts: { x: number; y: number }[], iterations = 2) => {
      for (let iter = 0; iter < iterations; iter++) {
        const newPts = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i];
          const p1 = pts[i + 1];

          const Q = {
            x: 0.75 * p0.x + 0.25 * p1.x,
            y: 0.75 * p0.y + 0.25 * p1.y,
          };
          const R = {
            x: 0.25 * p0.x + 0.75 * p1.x,
            y: 0.25 * p0.y + 0.75 * p1.y,
          };

          newPts.push(Q, R);
        }
        pts = newPts;
      }
      return pts;
    };

    // Project contour polygons → SVG paths
    contourList.forEach((contour: any) => {
      contour.coordinates.forEach((ring: any) => {
        const rawPts = ring[0].map(([gx, gy]: [number, number]) => ({
          x: gx * resolution,
          y: gy * resolution,
        }));

        const smoothed = chaikin(rawPts, 2);

        const pathGen = d3
          .line()
          .curve(d3.curveCatmullRom.alpha(0.5))
          .x((p: { x: number; y: number }) => p.x)
          .y((p: { x: number; y: number }) => p.y);

        const d = pathGen(smoothed);

        if (d) {
          const p = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          p.setAttribute("d", d);
          p.setAttribute("fill", "none");
          p.setAttribute("stroke", lineColor);
          p.setAttribute("stroke-width", "1.2");
          p.setAttribute("opacity", opacity.toString());
          p.setAttribute("stroke-linecap", "round");
          p.setAttribute("stroke-linejoin", "round");
          svg.appendChild(p);
        }
      });
    });

    // Resize handler
    const resize = () => {
      svg.setAttribute("width", (window.innerWidth * 1.5).toString());
      svg.setAttribute("height", (window.innerHeight * 1.5).toString());
    };

    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [lineColor, opacity]);

  return (
    <>
      <style>{`
        @keyframes topoPan {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-25%, -25%); }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          backgroundColor,
          overflow: "hidden",
        }}
      >
        <svg
          ref={svgRef}
          style={{
            position: "absolute",
            top: "-25%",
            left: "-25%",
            width: "150%",
            height: "150%",
            animation: "topoPan 120s linear infinite",
          }}
        />

        {/* Gradient overlays */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(0, 20, 40, 0.4) 0%, rgba(10, 12, 13, 0.3) 40%, rgba(18,20,22,0) 60%, rgba(28,30,32,0.3) 100%)"
              : "linear-gradient(135deg, rgba(0,51,102,0.25) 0%, rgba(154,179,213,0.15) 40%, rgba(233,233,228,0) 60%, rgba(173,157,123,0.2) 100%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isDarkMode
              ? "radial-gradient(circle at 30% 30%, rgba(28,30,32,0.3) 0%, rgba(10,12,13,0) 60%)"
              : "radial-gradient(circle at 30% 30%, rgba(233,233,228,0.6) 0%, rgba(233,233,228,0) 60%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </>
  );
};

export default TopographicBackground;
