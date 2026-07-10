import type { SVGProps } from "react";

export type IconName =
  | "arrow-down"
  | "arrow-up"
  | "chevron"
  | "coin"
  | "headphones"
  | "lanes"
  | "magnet"
  | "play"
  | "pulse"
  | "shield"
  | "spark"
  | "speed"
  | "wallet";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  name: IconName;
  title?: string;
}

export function Icon({ name, title, ...props }: IconProps) {
  const accessibilityProps = title
    ? { role: "img" as const, "aria-label": title }
    : { "aria-hidden": true };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...accessibilityProps}
      {...props}
    >
      {name === "arrow-down" && (
        <>
          <path d="M12 4v14" />
          <path d="m6.5 12.5 5.5 5.5 5.5-5.5" />
        </>
      )}
      {name === "arrow-up" && (
        <>
          <path d="M12 20V6" />
          <path d="m6.5 11.5 5.5-5.5 5.5 5.5" />
        </>
      )}
      {name === "chevron" && <path d="m8 9 4 4 4-4" />}
      {name === "coin" && (
        <>
          <path d="M7 4h12l-2 3H5l2-3Z" />
          <path d="M5 10h12l2 3H7l-2-3Z" />
          <path d="M7 16h12l-2 3H5l2-3Z" />
        </>
      )}
      {name === "headphones" && (
        <>
          <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
          <path d="M4 13a2 2 0 0 1 2-2h2v8H6a2 2 0 0 1-2-2v-4ZM20 13a2 2 0 0 0-2-2h-2v8h2a2 2 0 0 0 2-2v-4Z" />
        </>
      )}
      {name === "lanes" && (
        <>
          <path d="M7 4 4 20M17 4l3 16M12 4v5M12 15v5" />
          <path d="m9 9-3 3 3 3M15 9l3 3-3 3" />
        </>
      )}
      {name === "magnet" && (
        <>
          <path d="M6 4v8a6 6 0 0 0 12 0V4" />
          <path d="M6 8h4V4H6v4ZM14 8h4V4h-4v4Z" />
        </>
      )}
      {name === "play" && <path d="m9 6 9 6-9 6V6Z" />}
      {name === "pulse" && <path d="M3 12h4l2.2-5 4.1 10 2.2-5H21" />}
      {name === "shield" && (
        <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" />
      )}
      {name === "spark" && (
        <path d="m13 2-2 7H5l5 3-2 8 5-6h6l-4-4 3-5-5 2V2Z" />
      )}
      {name === "speed" && (
        <>
          <path d="M5 16a8 8 0 1 1 14 0" />
          <path d="m12 13 4-4" />
          <path d="M4 19h16" />
        </>
      )}
      {name === "wallet" && (
        <>
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z" />
          <path d="M15 10h6v5h-6a2.5 2.5 0 0 1 0-5Z" />
          <path d="M16 12.5h.01" />
        </>
      )}
    </svg>
  );
}
