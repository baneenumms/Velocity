import "./VelocityMark.css";

function VelocityMark({ className = "" }) {
  return (
    <div className={`velocity-mark ${className}`.trim()} aria-label="Velocity">
      VELOCITY
    </div>
  );
}

export default VelocityMark;
