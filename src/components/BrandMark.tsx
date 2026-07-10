interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className="brand-mark" role="img" aria-label="Meowave">
      <span className="brand-mark__symbol" aria-hidden="true">
        <img src="/meowave-mark.svg" alt="" width="38" height="38" />
      </span>
      {!compact && (
        <span className="brand-mark__type">
          <span>MEO</span>
          <span>WAVE</span>
        </span>
      )}
    </span>
  );
}
