// Tiny inline SVG icons. Style: 1.5px stroke, currentColor, 16px default.

const Icon = ({
  d,
  size = 16,
  fill = 'none',
  stroke = 'currentColor',
  strokeWidth = 1.6,
  children,
  ...rest
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

export const IconCheck = (p) => <Icon {...p} d="M4 12.5l5 5L20 6.5" />;

export const IconDot = ({ size = 8, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 8 8" {...p}>
    <circle cx="4" cy="4" r="4" fill="currentColor" />
  </svg>
);

export const IconAlert = (p) => (
  <Icon {...p}>
    <path d="M12 3l10 18H2L12 3z" />
    <path d="M12 10v5" />
    <path d="M12 18.2v.1" />
  </Icon>
);

export const IconSparkle = (p) => (
  <Icon {...p}>
    <path d="M12 3.5l1.8 4.7L18.5 10l-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.8L12 3.5z" />
    <path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7L19 15z" />
  </Icon>
);

export const IconSend = (p) => <Icon {...p} d="M4 12l16-8-6 18-3-7-7-3z" />;

export const IconChevron = (p) => <Icon {...p} d="M6 9l6 6 6-6" />;

export const IconPlus = (p) => (
  <Icon {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Icon>
);

export const IconLogo = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 18 L9 8 L13 14 L20 5" />
    <circle cx="20" cy="5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);
