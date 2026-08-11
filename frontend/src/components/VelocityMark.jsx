import "./VelocityMark.css";

function VelocityMark({ className = "" }) {
  return (
    <div className={`velocity-mark ${className}`.trim()} aria-label="Velocity">
      <span>VEL</span><span className="velocity-mark-tyre" aria-hidden="true" /><span>CITY</span>
    </div>
  );
}

export default VelocityMark;
