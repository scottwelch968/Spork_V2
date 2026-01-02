export function SporkMark({ className = '' }) {
  return (
    <svg viewBox='0 0 100 100' className={className}>
      <g stroke='currentColor' strokeWidth='8' strokeLinecap='round' strokeLinejoin='round' fill='none'>
        <circle cx='50' cy='50' r='14'/>
        <line x1='50' y1='36' x2='50' y2='16'/>
        <line x1='60.6' y1='39.4' x2='75' y2='25'/>
        <line x1='64' y1='50' x2='84' y2='50'/>
        <line x1='60.6' y1='60.6' x2='75' y2='75'/>
        <line x1='50' y1='64' x2='50' y2='84'/>
        <line x1='39.4' y1='60.6' x2='25' y2='75'/>
        <line x1='36' y1='50' x2='16' y2='50'/>
        <line x1='39.4' y1='39.4' x2='25' y2='25'/>
      </g>
    </svg>
  );
}
