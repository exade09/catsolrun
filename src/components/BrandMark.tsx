interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className="brand-mark" aria-label="Sol Cat Run home">
      <span className="brand-mark__symbol" aria-hidden="true">
        <svg viewBox="0 0 42 42" fill="none">
          <path className="brand-mark__ear" d="m8 15 3-10 8 7h4l8-7 3 10v12L27 35H15l-7-8V15Z" />
          <path className="brand-mark__face" d="m11 15 8-3h4l8 3-2 13-6 5h-4l-6-5-2-13Z" />
          <path className="brand-mark__muzzle" d="m16 23 5-2 5 2-2 6h-6l-2-6Z" />
          <path className="brand-mark__band" d="M7 21a14 14 0 0 1 28 0" />
          <path className="brand-mark__cup" d="M5 21h6v9H8a3 3 0 0 1-3-3v-6ZM37 21h-6v9h3a3 3 0 0 0 3-3v-6Z" />
        </svg>
      </span>
      {!compact && (
        <span className="brand-mark__type">
          <span>SOL CAT</span>
          <span>RUN</span>
        </span>
      )}
    </span>
  );
}
