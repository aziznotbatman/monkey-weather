/** Small hand-drawn style icons (stroke = currentColor). Decorative: always aria-hidden. */
interface IconProps {
  size?: number;
}

function Svg({ size = 22, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21.5c-3.8-4.6-6.6-8.2-6.6-11.6A6.6 6.6 0 0 1 12 3.3a6.6 6.6 0 0 1 6.6 6.6c0 3.4-2.8 7-6.6 11.6Z" />
    <circle cx="12" cy="9.8" r="2.3" />
  </Svg>
);

export const LocateIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="6.2" />
    <path d="M12 2.5v3.2M12 18.3v3.2M2.5 12h3.2M18.3 12h3.2" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
  </Svg>
);

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6.4" />
    <path d="m15.4 15.6 5.3 5.1" />
  </Svg>
);

export const SlidersIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h9M17.5 7H20M4 17h3M11.5 17H20" />
    <circle cx="15.2" cy="7" r="2.2" />
    <circle cx="9.2" cy="17" r="2.2" />
  </Svg>
);

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6.3 18 17.8M18.2 6 5.8 18" />
  </Svg>
);

export const BackIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 5.5 3.8 12l6.2 6.4M4.5 12h15.7" />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12.2h14" />
  </Svg>
);

export const MinusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12.2h14" />
  </Svg>
);
