import type { ReactNode } from "react";

interface SectionIntroProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  id?: string;
}

export function SectionIntro({
  eyebrow,
  title,
  description,
  align = "left",
  id,
}: SectionIntroProps) {
  return (
    <header className={`section-intro section-intro--${align}`}>
      <p className="section-intro__eyebrow">
        <span aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 id={id}>{title}</h2>
      {description && <p className="section-intro__description">{description}</p>}
    </header>
  );
}
