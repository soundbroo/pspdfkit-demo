export const Placeholder = ({ title, dragEventType, onDragChange }) => {
  const handleDragStart = () => onDragChange(dragEventType);

  const handleDragEnd = () => onDragChange(null);

  return (
    <button
      draggable
      className="signature-field"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {title}
    </button>
  );
};
