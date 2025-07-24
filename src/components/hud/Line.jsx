import React, { useEffect, useState } from "react";
import "styles/Line.scss";

const getAnchorCoords = (rect, anchor) => {
  switch (anchor) {
    case "top":
      return { x: rect.left + rect.width / 2, y: rect.top };
    case "bottom":
      return { x: rect.left + rect.width / 2, y: rect.bottom };
    case "left":
      return { x: rect.left, y: rect.top + rect.height / 2 };
    case "right":
      return { x: rect.right, y: rect.top + rect.height / 2 };
    case "center":
    default:
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
};

/**
 * containerRef: ref to the container element the SVG should overlay.
 * If not provided, defaults to viewport (left/top 0).
 * All coordinates are calculated relative to this container.
 *
 * breakpointCount: number of intermediate breakpoints for routing
 * If > 0, the line will be split into (breakpointCount + 1) segments
 * randomizeBreakpoints: if true, breakpoints will be offset randomly
 */
const Line = ({
  startRef = null,
  endRef = null,
  color = "#fff",
  animate = false,
  className = "",
  orientation = "angled", // fallback
  length = 100,
  start = null, // legacy
  end = null,   // legacy
  holeRadius = 3,
  holeColor = "#fff",
  holeStroke = "#fff",
  holeStrokeWidth = 1,
  routing = "auto", // 'auto', 'hv', 'vh', 'diagonal'
  startAnchor = "center", // 'center', 'top', 'bottom', 'left', 'right'
  endAnchor = "center",   // 'center', 'top', 'bottom', 'left', 'right'
  breakpointCount = 0,    // number of breakpoints for routing
  randomizeBreakpoints = false, // if true, breakpoints are offset randomly
  containerRef = null,    // ref to container element
}) => {
  const [coords, setCoords] = useState(null);
  const [containerRect, setContainerRect] = useState({ left: 0, top: 0 });

  useEffect(() => {
    const updateCoords = () => {
      if (!startRef?.current || !endRef?.current) return;
      const startRect = startRef.current.getBoundingClientRect();
      const endRect = endRef.current.getBoundingClientRect();
      const startPoint = getAnchorCoords(startRect, startAnchor);
      const endPoint = getAnchorCoords(endRect, endAnchor);
      let container = containerRef?.current;
      let rect = { left: 0, top: 0 };
      if (container) {
        rect = container.getBoundingClientRect();
      }
      setContainerRect(rect);
      setCoords({
        x1: startPoint.x - rect.left,
        y1: startPoint.y - rect.top,
        x2: endPoint.x - rect.left,
        y2: endPoint.y - rect.top,
      });
    };

    updateCoords();
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [startRef, endRef, startAnchor, endAnchor, containerRef]);

  // Helper to generate path data for different routing modes
  const getPathData = (x1, y1, x2, y2, routingMode, breakpointCount, randomizeBreakpoints) => {
    const rand = (range) => (Math.random() - 0.5) * range;

    if (breakpointCount > 0 && (routingMode === "hv" || routingMode === "vh")) {
      const points = [{ x: x1, y: y1 }];
      let last = { x: x1, y: y1 };
      let dx = (x2 - x1) / (breakpointCount + 1);
      let dy = (y2 - y1) / (breakpointCount + 1);
      let horizontalFirst = routingMode === "hv";
      for (let i = 1; i <= breakpointCount; i++) {
        let t = i / (breakpointCount + 1);
        let px, py;
        if ((i % 2 === 1) === horizontalFirst) {
          px = x1 + dx * i;
          py = last.y;
        } else {
          px = last.x;
          py = y1 + dy * i;
        }
        if (randomizeBreakpoints) {
          px += rand(Math.abs(dx) * 0.3);
          py += rand(Math.abs(dy) * 0.3);
        }
        points.push({ x: px, y: py });
        last = { x: px, y: py };
      }
      points.push({ x: x2, y: y2 });
      return (
        "M " +
        points
          .map((pt) => `${pt.x} ${pt.y}`)
          .join(" L ")
      );
    }
    if (routingMode === "diagonal" && breakpointCount > 0) {
      const points = [{ x: x1, y: y1 }];
      for (let i = 1; i <= breakpointCount; i++) {
        const t = i / (breakpointCount + 1);
        let px = x1 + (x2 - x1) * t;
        let py = y1 + (y2 - y1) * t;
        if (randomizeBreakpoints) {
          px += rand(Math.abs(x2 - x1) * 0.3);
          py += rand(Math.abs(y2 - y1) * 0.3);
        }
        points.push({ x: px, y: py });
      }
      points.push({ x: x2, y: y2 });
      return (
        "M " +
        points
          .map((pt) => `${pt.x} ${pt.y}`)
          .join(" L ")
      );
    }
    if (routingMode === "diagonal") {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    if (routingMode === "hv") {
      return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`;
    }
    if (routingMode === "vh") {
      return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;
    }
    // 'auto': choose the shorter total path
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    if (dx < dy) {
      return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`; // hv
    } else {
      return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`; // vh
    }
  };

  if (startRef && endRef && coords) {
    // Calculate SVG bounds
    const left = 0;
    const top = 0;
    const width = (containerRef?.current?.offsetWidth || window.innerWidth);
    const height = (containerRef?.current?.offsetHeight || window.innerHeight);
    const x1 = coords.x1;
    const y1 = coords.y1;
    const x2 = coords.x2;
    const y2 = coords.y2;
    const pathData = getPathData(x1, y1, x2, y2, routing, breakpointCount, randomizeBreakpoints);
    return (
      <svg
        className={`line-svg ${className}`}
        style={{
          position: "absolute",
          left,
          top,
          width,
          height,
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        {/* Draw the path */}
        <path
          d={pathData}
          stroke={color}
          strokeWidth={2}
          fill="none"
          className={animate ? "svg-line animated" : "svg-line"}
        />
        {/* Draw connector holes (pads) on top */}
        <circle
          cx={x1}
          cy={y1}
          r={holeRadius}
          fill={holeColor}
          stroke={holeStroke}
          strokeWidth={holeStrokeWidth}
          className="svg-connector-hole"
        />
        <circle
          cx={x2}
          cy={y2}
          r={holeRadius}
          fill={holeColor}
          stroke={holeStroke}
          strokeWidth={holeStrokeWidth}
          className="svg-connector-hole"
        />
      </svg>
    );
  }

  // Fallback: legacy start/end or div-based rendering
  const getLegacyPathData = (start, end, routingMode, breakpointCount, randomizeBreakpoints) => {
    const rand = (range) => (Math.random() - 0.5) * range;
    if (!start || !end) return null;
    if (breakpointCount > 0 && (routingMode === "hv" || routingMode === "vh")) {
      const points = [{ x: start.x, y: start.y }];
      let last = { x: start.x, y: start.y };
      let dx = (end.x - start.x) / (breakpointCount + 1);
      let dy = (end.y - start.y) / (breakpointCount + 1);
      let horizontalFirst = routingMode === "hv";
      for (let i = 1; i <= breakpointCount; i++) {
        let t = i / (breakpointCount + 1);
        let px, py;
        if ((i % 2 === 1) === horizontalFirst) {
          px = start.x + dx * i;
          py = last.y;
        } else {
          px = last.x;
          py = start.y + dy * i;
        }
        if (randomizeBreakpoints) {
          px += rand(Math.abs(dx) * 0.3);
          py += rand(Math.abs(dy) * 0.3);
        }
        points.push({ x: px, y: py });
        last = { x: px, y: py };
      }
      points.push({ x: end.x, y: end.y });
      return (
        "M " +
        points
          .map((pt) => `${pt.x} ${pt.y}`)
          .join(" L ")
      );
    }
    if (routingMode === "diagonal" && breakpointCount > 0) {
      const points = [{ x: start.x, y: start.y }];
      for (let i = 1; i <= breakpointCount; i++) {
        const t = i / (breakpointCount + 1);
        let px = start.x + (end.x - start.x) * t;
        let py = start.y + (end.y - start.y) * t;
        if (randomizeBreakpoints) {
          px += rand(Math.abs(end.x - start.x) * 0.3);
          py += rand(Math.abs(end.y - start.y) * 0.3);
        }
        points.push({ x: px, y: py });
      }
      points.push({ x: end.x, y: end.y });
      return (
        "M " +
        points
          .map((pt) => `${pt.x} ${pt.y}`)
          .join(" L ")
      );
    }
    if (routingMode === "diagonal") {
      return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    }
    if (routingMode === "hv") {
      return `M ${start.x} ${start.y} L ${end.x} ${start.y} L ${end.x} ${end.y}`;
    }
    if (routingMode === "vh") {
      return `M ${start.x} ${start.y} L ${start.x} ${end.y} L ${end.x} ${end.y}`;
    }
    // 'auto': choose the shorter total path
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    if (dx < dy) {
      return `M ${start.x} ${start.y} L ${end.x} ${start.y} L ${end.x} ${end.y}`; // hv
    } else {
      return `M ${start.x} ${start.y} L ${start.x} ${end.y} L ${end.x} ${end.y}`; // vh
    }
  };

  if (start && end) {
    const pathData = getLegacyPathData(start, end, routing, breakpointCount, randomizeBreakpoints);
    return (
      <svg className={`line-svg ${className}`} style={{ position: 'absolute', pointerEvents: 'none', overflow: 'visible' }}>
        <path
          d={pathData}
          className={animate ? 'svg-line animated' : 'svg-line'}
          style={{ stroke: color, fill: 'none' }}
        />
        {/* Draw connector holes (pads) on top */}
        <circle
          cx={start.x}
          cy={start.y}
          r={holeRadius}
          fill={holeColor}
          stroke={holeStroke}
          strokeWidth={holeStrokeWidth}
          className="svg-connector-hole"
        />
        <circle
          cx={end.x}
          cy={end.y}
          r={holeRadius}
          fill={holeColor}
          stroke={holeStroke}
          strokeWidth={holeStrokeWidth}
          className="svg-connector-hole"
        />
      </svg>
    );
  }

  // Fallback to div-based rendering
  return (
    <div className={`line ${className}`}>
      <div className="connector" style={{ borderColor: color }} />
      {(orientation === "vertical" || orientation === "angled") && (
        <div
          className={`line-0${animate ? " animated" : ""}`}
          style={{
            height: orientation === "vertical" ? length : 50,
            backgroundColor: color,
            transform: orientation === "angled" ? "rotate(45deg)" : "none",
          }}
        />
      )}
      {(orientation === "horizontal" || orientation === "angled") && (
        <div
          className={`line-1${animate ? " animated" : ""}`}
          style={{
            width: orientation === "horizontal" ? length : 100,
            backgroundColor: color,
          }}
        />
      )}
    </div>
  );
};

export default Line;
