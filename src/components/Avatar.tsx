import type { CharacterKind } from "../game/types";

interface Palette {
  fur: string;
  dark: string;
  inner: string;
}

const PALETTES: Record<CharacterKind, Palette> = {
  rabbit: { fur: "#9aa0ad", dark: "#6b7280", inner: "#e8b4c0" },
  fox: { fur: "#d97a2f", dark: "#a8551a", inner: "#f3e3cf" },
  boar: { fur: "#7a5b40", dark: "#54402e", inner: "#c9a68e" },
  bull: { fur: "#5d4636", dark: "#3d2f24", inner: "#b08e78" },
  pig: { fur: "#e39cb0", dark: "#c4748d", inner: "#f5cdd8" },
  rat: { fur: "#8d99ae", dark: "#5c6675", inner: "#d9c4bd" },
  wolf: { fur: "#6e7783", dark: "#494f58", inner: "#cfd6de" },
  cat: { fur: "#3f3a45", dark: "#2a2630", inner: "#d8b7c4" },
  goat: { fur: "#c9c3b4", dark: "#98917f", inner: "#efe9da" },
};

interface Props {
  kind: CharacterKind;
  size?: number;
  className?: string;
}

/** Стилизованный нуарный портрет зверя-завсегдатая бара. */
export function Avatar({ kind, size = 72, className }: Props) {
  const p = PALETTES[kind];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      {/* Уши/рога по виду */}
      {kind === "rabbit" && (
        <>
          <ellipse cx="34" cy="22" rx="9" ry="24" fill={p.dark} transform="rotate(-14 34 22)" />
          <ellipse cx="66" cy="22" rx="9" ry="24" fill={p.dark} transform="rotate(14 66 22)" />
          <ellipse cx="34" cy="24" rx="4" ry="16" fill={p.inner} transform="rotate(-14 34 24)" />
          <ellipse cx="66" cy="24" rx="4" ry="16" fill={p.inner} transform="rotate(14 66 24)" />
        </>
      )}
      {(kind === "fox" || kind === "wolf" || kind === "cat") && (
        <>
          <path d={`M20 38 L26 8 L44 28 Z`} fill={p.dark} />
          <path d={`M80 38 L74 8 L56 28 Z`} fill={p.dark} />
          <path d={`M25 33 L28 17 L38 27 Z`} fill={p.inner} />
          <path d={`M75 33 L72 17 L62 27 Z`} fill={p.inner} />
        </>
      )}
      {kind === "goat" && (
        <>
          {/* Загнутые рога */}
          <path
            d="M30 30 Q16 18 22 8 Q30 16 34 24"
            fill="none"
            stroke="#8a7f68"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M70 30 Q84 18 78 8 Q70 16 66 24"
            fill="none"
            stroke="#8a7f68"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Висячие уши */}
          <ellipse cx="22" cy="50" rx="7" ry="12" fill={p.dark} transform="rotate(24 22 50)" />
          <ellipse cx="78" cy="50" rx="7" ry="12" fill={p.dark} transform="rotate(-24 78 50)" />
        </>
      )}
      {kind === "boar" && (
        <>
          <path d="M18 42 Q10 20 30 16 Q24 32 30 40 Z" fill={p.dark} />
          <path d="M82 42 Q90 20 70 16 Q76 32 70 40 Z" fill={p.dark} />
        </>
      )}
      {kind === "bull" && (
        <>
          <path d="M22 36 Q4 30 10 12 Q20 22 30 28 Z" fill="#cfc4ae" />
          <path d="M78 36 Q96 30 90 12 Q80 22 70 28 Z" fill="#cfc4ae" />
        </>
      )}
      {kind === "pig" && (
        <>
          <path d="M20 34 Q12 16 34 20 Z" fill={p.dark} />
          <path d="M80 34 Q88 16 66 20 Z" fill={p.dark} />
        </>
      )}
      {kind === "rat" && (
        <>
          <circle cx="26" cy="30" r="13" fill={p.dark} />
          <circle cx="74" cy="30" r="13" fill={p.dark} />
          <circle cx="26" cy="30" r="7" fill={p.inner} opacity="0.7" />
          <circle cx="74" cy="30" r="7" fill={p.inner} opacity="0.7" />
        </>
      )}

      {/* Голова */}
      <circle cx="50" cy="55" r="34" fill={p.fur} />
      {/* Морда */}
      <ellipse cx="50" cy="67" rx="19" ry="14" fill={p.inner} />
      {/* Глаза — усталые, с прищуром */}
      <g fill="#181418">
        <ellipse cx="37" cy="50" rx="5" ry="6" />
        <ellipse cx="63" cy="50" rx="5" ry="6" />
        <rect x="30" y="43" width="15" height="3.4" rx="1.7" fill={p.dark} transform="rotate(-8 37 45)" />
        <rect x="55" y="43" width="15" height="3.4" rx="1.7" fill={p.dark} transform="rotate(8 63 45)" />
      </g>
      {/* Нос */}
      {(kind === "boar" || kind === "pig") ? (
        <g>
          <ellipse cx="50" cy="64" rx="10" ry="7" fill={p.dark} />
          <circle cx="46" cy="64" r="2" fill="#221c20" />
          <circle cx="54" cy="64" r="2" fill="#221c20" />
        </g>
      ) : (
        <path d="M46 60 Q50 64 54 60 Q52 65 50 65 Q48 65 46 60Z" fill="#221c20" />
      )}
      {/* Клыки вепря */}
      {kind === "boar" && (
        <>
          <path d="M40 70 Q36 76 41 77 Q43 73 43 70 Z" fill="#efe6d2" />
          <path d="M60 70 Q64 76 59 77 Q57 73 57 70 Z" fill="#efe6d2" />
        </>
      )}
      {/* Шрам волка */}
      {kind === "wolf" && (
        <path d="M66 40 L72 52" stroke="#3a3f46" strokeWidth="2.4" strokeLinecap="round" />
      )}
      {/* Усы кошки */}
      {kind === "cat" && (
        <g stroke="#efe6d2" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
          <path d="M34 66 L18 62" />
          <path d="M34 69 L19 70" />
          <path d="M66 66 L82 62" />
          <path d="M66 69 L81 70" />
        </g>
      )}
      {/* Бородка козла */}
      {kind === "goat" && (
        <path d="M50 80 Q46 92 50 96 Q54 92 50 80 Z" fill={p.dark} />
      )}
      <circle cx="50" cy="55" r="34" fill="none" stroke="#14100f" strokeWidth="2.5" opacity="0.55" />
    </svg>
  );
}
