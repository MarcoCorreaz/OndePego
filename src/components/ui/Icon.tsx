import React from 'react';

export type IconName =
  | 'search'
  | 'pin'
  | 'cross'
  | 'a11y'
  | 'clock'
  | 'heart'
  | 'drop'
  | 'wind'
  | 'pulse'
  | 'check'
  | 'back'
  | 'doc'
  | 'chev'
  | 'share'
  | 'list'
  | 'map'
  | 'download'
  | 'close'
  | 'filter'
  | 'info';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  className?: string;
  size?: number | string;
}

export function Icon({
  name,
  className = 'h-5 w-5 shrink-0',
  size,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  ...props
}: IconProps) {
  const isAriaHidden = ariaHidden !== undefined ? ariaHidden : ariaLabel ? undefined : true;

  const style = size ? { width: size, height: size, ...props.style } : props.style;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={isAriaHidden}
      aria-label={ariaLabel}
      className={className}
      style={style}
      {...props}
    >
      {name === 'search' && (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </>
      )}
      {name === 'pin' && (
        <>
          <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      )}
      {name === 'cross' && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </>
      )}
      {name === 'a11y' && (
        <>
          <circle cx="12" cy="4.5" r="2" />
          <path d="M4 9h16" />
          <path d="M12 9v5" />
          <path d="M9 20l3-6 3 6" />
        </>
      )}
      {name === 'clock' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      )}
      {name === 'heart' && (
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      )}
      {name === 'drop' && (
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      )}
      {name === 'wind' && (
        <>
          <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
          <path d="M19.7 17a2.5 2.5 0 1 0-1.8-4.3H2" />
          <path d="M9.5 4.5A2 2 0 1 1 11 8H2" />
        </>
      )}
      {name === 'pulse' && (
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      )}
      {name === 'check' && (
        <path d="M20 6 9 17l-5-5" />
      )}
      {name === 'back' && (
        <>
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </>
      )}
      {name === 'doc' && (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </>
      )}
      {name === 'chev' && (
        <path d="m9 18 6-6-6-6" />
      )}
      {name === 'share' && (
        <>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </>
      )}
      {name === 'list' && (
        <>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </>
      )}
      {name === 'map' && (
        <>
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </>
      )}
      {name === 'download' && (
        <>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </>
      )}
      {name === 'close' && (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      )}
      {name === 'filter' && (
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      )}
      {name === 'info' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="8" strokeWidth={3} />
          <line x1="12" y1="12" x2="12" y2="16" />
        </>
      )}
    </svg>
  );
}
