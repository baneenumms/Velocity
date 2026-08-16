import "./VelocityMark.css";

function VelocityMark({ className = "" }) {
  return (
    <div className={`velocity-mark ${className}`.trim()} aria-label="Velocity">
      <span>VELOCITY</span>
    </div>
  );
}

export default VelocityMark;
