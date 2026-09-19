"use client";

import { useEffect, useRef } from "react";

type Direction = "up" | "down" | "left" | "right" | "diagonal";
type Shape = "square" | "hexagon" | "circle" | "triangle";

type ShapeGridProps = {
  speed?: number;
  squareSize?: number;
  direction?: Direction;
  borderColor?: string;
  hoverFillColor?: string;
  hoverTrailAmount?: number;
  shape?: Shape;
  className?: string;
};

type Cell = { x: number; y: number };

export default function ShapeGrid({
  speed = 0.18,
  squareSize = 52,
  direction = "diagonal",
  borderColor = "#283028",
  hoverFillColor = "#33452b",
  hoverTrailAmount = 2,
  shape = "hexagon",
  className = "",
}: ShapeGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    const targetCanvas = canvas;
    const targetContext = context;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const offset = { x: 0, y: 0 };
    let hovered: Cell | null = null;
    let trail: Cell[] = [];
    const opacities = new Map<string, number>();
    let frame = 0;
    let visible = true;

    const isHex = shape === "hexagon";
    const hexWidth = squareSize * 1.5;
    const hexHeight = squareSize * Math.sqrt(3);

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = targetCanvas.getBoundingClientRect();
      targetCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
      targetCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
      targetContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    };

    const pathHexagon = (x: number, y: number) => {
      context.beginPath();
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI / 3) * index;
        const vertexX = x + squareSize * Math.cos(angle);
        const vertexY = y + squareSize * Math.sin(angle);
        if (index === 0) context.moveTo(vertexX, vertexY);
        else context.lineTo(vertexX, vertexY);
      }
      context.closePath();
    };

    const pathCell = (x: number, y: number, flip = false) => {
      if (shape === "hexagon") return pathHexagon(x, y);
      context.beginPath();
      if (shape === "circle") context.arc(x, y, squareSize / 2, 0, Math.PI * 2);
      else if (shape === "triangle") {
        context.moveTo(x, y + (flip ? 1 : -1) * squareSize / 2);
        context.lineTo(x + squareSize / 2, y + (flip ? -1 : 1) * squareSize / 2);
        context.lineTo(x - squareSize / 2, y + (flip ? -1 : 1) * squareSize / 2);
      } else context.rect(x, y, squareSize, squareSize);
      context.closePath();
    };

    function paintCell(x: number, y: number, key: string, flip = false) {
      const opacity = opacities.get(key) || 0;
      pathCell(x, y, flip);
      if (opacity > 0) {
        targetContext.globalAlpha = opacity;
        targetContext.fillStyle = hoverFillColor;
        targetContext.fill();
        targetContext.globalAlpha = 1;
      }
      targetContext.strokeStyle = borderColor;
      targetContext.lineWidth = 1;
      targetContext.stroke();
    }

    function draw() {
      const width = targetCanvas.clientWidth;
      const height = targetCanvas.clientHeight;
      targetContext.clearRect(0, 0, width, height);

      if (isHex) {
        const columnShift = Math.floor(offset.x / hexWidth);
        const offsetX = ((offset.x % hexWidth) + hexWidth) % hexWidth;
        const offsetY = ((offset.y % hexHeight) + hexHeight) % hexHeight;
        const columns = Math.ceil(width / hexWidth) + 3;
        const rows = Math.ceil(height / hexHeight) + 3;
        for (let column = -2; column < columns; column += 1) {
          for (let row = -2; row < rows; row += 1) {
            const x = column * hexWidth + offsetX;
            const y = row * hexHeight + ((column + columnShift) % 2 !== 0 ? hexHeight / 2 : 0) + offsetY;
            paintCell(x, y, `${column},${row}`);
          }
        }
      } else {
        const stepX = shape === "triangle" ? squareSize / 2 : squareSize;
        const offsetX = ((offset.x % stepX) + stepX) % stepX;
        const offsetY = ((offset.y % squareSize) + squareSize) % squareSize;
        const columns = Math.ceil(width / stepX) + 4;
        const rows = Math.ceil(height / squareSize) + 4;
        for (let column = -2; column < columns; column += 1) {
          for (let row = -2; row < rows; row += 1) {
            const x = column * stepX + offsetX;
            const y = row * squareSize + squareSize / 2 + offsetY;
            paintCell(x, y, `${column},${row}`, (column + row) % 2 !== 0);
          }
        }
      }
    }

    const updateOpacities = () => {
      const targets = new Map<string, number>();
      if (hovered) targets.set(`${hovered.x},${hovered.y}`, 1);
      trail.forEach((cell, index) => targets.set(`${cell.x},${cell.y}`, (trail.length - index) / (trail.length + 1)));
      targets.forEach((_, key) => {
        if (!opacities.has(key)) opacities.set(key, 0);
      });
      opacities.forEach((opacity, key) => {
        const next = opacity + ((targets.get(key) || 0) - opacity) * 0.14;
        if (next < 0.005) opacities.delete(key);
        else opacities.set(key, next);
      });
    };

    const animate = () => {
      if (!reducedMotion.matches) {
        const amount = Math.max(speed, 0.1);
        if (direction === "left" || direction === "diagonal") offset.x += amount;
        if (direction === "right") offset.x -= amount;
        if (direction === "up" || direction === "diagonal") offset.y += amount;
        if (direction === "down") offset.y -= amount;
      }
      updateOpacities();
      draw();
      if (visible) frame = requestAnimationFrame(animate);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = targetCanvas.getBoundingClientRect();
      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!isInside) {
        onPointerLeave();
        return;
      }

      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      let next: Cell;
      if (isHex) {
        const columnShift = Math.floor(offset.x / hexWidth);
        const offsetX = ((offset.x % hexWidth) + hexWidth) % hexWidth;
        const offsetY = ((offset.y % hexHeight) + hexHeight) % hexHeight;
        const column = Math.round((pointerX - offsetX) / hexWidth);
        const rowOffset = (column + columnShift) % 2 !== 0 ? hexHeight / 2 : 0;
        next = { x: column, y: Math.round((pointerY - offsetY - rowOffset) / hexHeight) };
      } else {
        const stepX = shape === "triangle" ? squareSize / 2 : squareSize;
        next = { x: Math.floor((pointerX - offset.x) / stepX), y: Math.floor((pointerY - offset.y) / squareSize) };
      }
      if (!hovered || hovered.x !== next.x || hovered.y !== next.y) {
        if (hovered && hoverTrailAmount > 0) trail = [hovered, ...trail].slice(0, hoverTrailAmount);
        hovered = next;
      }
    };

    const onPointerLeave = () => {
      if (hovered && hoverTrailAmount > 0) trail = [hovered, ...trail].slice(0, hoverTrailAmount);
      hovered = null;
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(animate);
    });

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    observer.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    resize();
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [borderColor, direction, hoverFillColor, hoverTrailAmount, shape, speed, squareSize]);

  return <canvas ref={canvasRef} className={`shape-grid-canvas ${className}`} aria-hidden="true" />;
}
