import { useEffect, useState, useRef } from "react";

const getDrawCoordinates = ({ pageX, pageY }, canvas) => {
  const { left, top } = canvas.getBoundingClientRect();

  return {
    x: pageX - left,
    y: pageY - top,
  };
};

export const InkInput = ({ onSave }) => {
  const canvasRef = useRef();

  const [shouldDrow, setShouldDraw] = useState(false);
  const [context, setContext] = useState({});

  const { canvas } = context;

  useEffect(() => {
    if (!canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");

    setContext(context);
  }, []);

  const handleMouseDown = (e) => {
    setShouldDraw(true);
    const { x, y } = getDrawCoordinates(e, canvas);
    context.beginPath();
    context.moveTo(x, y);
  };
  const handleMouseMove = (e) => {
    if (!shouldDrow) return;
    const { x, y } = getDrawCoordinates(e, canvas);
    context.lineTo(x, y);
    context.stroke();
  };
  const handleMouseUp = (e) => {
    const { x, y } = getDrawCoordinates(e, canvas);
    context.lineTo(x, y);
    context.stroke();
    context.closePath();
    setShouldDraw(false);
    onSave(canvasRef);
  };

  return (
    <canvas
      ref={canvasRef}
      id="ink-canvas"
      width="300"
      height="200"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      Не работает \(^_^)/
    </canvas>
  );
};
