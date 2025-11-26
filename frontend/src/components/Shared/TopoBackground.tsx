import React, { useMemo } from "react";
import "./TopoBackground.css";

// Utility to generate a smooth random wave path
const generateWavePath = (
  y: number,
  amplitude = 20,
  wavelength = 200,
  width = 800
) => {
  const points = [];
  const step = 5; // Smaller step for smoother curves
  for (let x = 0; x <= width; x += step) {
    const offset = Math.sin((x / wavelength) * 2 * Math.PI) * amplitude;
    points.push(`${x} ${y + offset}`);
  }
  return `M${points.join(" L")}`;
};

interface TopoBackgroundProps {
  lineCount?: number;
  width?: number;
  height?: number;
}

const TopoBackground: React.FC<TopoBackgroundProps> = ({
  lineCount = 20,
  width = 800,
  height = 600,
}) => {
  // Generate lines only once per component mount
  const paths = useMemo(() => {
    const arr = [];
    for (let i = 0; i < lineCount; i++) {
      const y = ((i + 1) * height) / (lineCount + 1);
      const amplitude = 5 + Math.random() * 10; // Smaller amplitude for subtlety
      const wavelength = 200 + Math.random() * 300; // Longer wavelengths for smoother curves
      arr.push(generateWavePath(y, amplitude, wavelength, width));
    }
    return arr;
  }, [lineCount, width, height]);

  return (
    <div className="topo-bg fixed inset-0 w-screen h-screen z-[-1] overflow-hidden pointer-events-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="topo-svg w-full h-full"
      >
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            className="topo-path"
            style={{ strokeOpacity: 0.015 + i * 0.008 }}
            fill="none"
            strokeWidth={1}
          />
        ))}
      </svg>
    </div>
  );
};

export default TopoBackground;
