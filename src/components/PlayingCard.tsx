import { motion } from "framer-motion";
import type { Card } from "../game/types";
import { RANK_SHORT } from "../game/types";

const SUIT_GLYPH: Record<string, string> = { Q: "♥", K: "♦", A: "♣", JKR: "★" };

type Size = "sm" | "md" | "lg";

interface FaceProps {
  rank: string;
  size?: Size;
  devil?: boolean;
}

export function CardFace({ rank, size = "md", devil = false }: FaceProps) {
  const glyph = SUIT_GLYPH[rank] ?? "?";
  const short = RANK_SHORT[rank as keyof typeof RANK_SHORT] ?? rank[0];
  const isJoker = rank === "JKR";
  return (
    <div
      className={[
        "card-face",
        `card-face--${size}`,
        isJoker ? "is-joker" : "",
        devil ? "is-devil" : "",
      ].join(" ")}
    >
      <div className="card-corner card-corner--tl">
        <span>{short}</span>
        <span className="card-suit">{glyph}</span>
      </div>
      <div className="card-center">
        <svg viewBox="0 0 60 80" aria-hidden="true">
          <text
            x="30"
            y="52"
            textAnchor="middle"
            fontSize={isJoker ? 40 : 42}
            fontWeight="700"
            fill={devil ? "#7a1220" : isJoker ? "#8c1f28" : "#221c20"}
            fontFamily="'Russo One', system-ui, sans-serif"
          >
            {short}
          </text>
          <text x="30" y="72" textAnchor="middle" fontSize="20" fill="#8c1f28">
            {glyph}
          </text>
        </svg>
      </div>
      <div className="card-corner card-corner--br">
        <span>{short}</span>
        <span className="card-suit">{glyph}</span>
      </div>
      <div className="card-frame" />
      {isJoker && <span className="joker-badge">Джокер</span>}
      {devil && (
        <span className="devil-badge" title="Дьявол">
          ☠ Дьявол
        </span>
      )}
    </div>
  );
}

function CardBack({ size = "md" }: { size?: Size }) {
  return (
    <div className={`card-back card-back--${size}`}>
      <svg viewBox="0 0 60 84" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern
            id={`lattice-${size}`}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <rect width="10" height="10" fill="#5a1420" />
            <path
              d="M0 10 L10 0 M-2 2 L2 -2 M8 12 L12 8"
              stroke="#7d2230"
              strokeWidth="1.4"
            />
          </pattern>
        </defs>
        <rect x="3" y="3" width="54" height="78" rx="4" fill={`url(#lattice-${size})`} />
        <rect
          x="6.5"
          y="6.5"
          width="47"
          height="71"
          rx="3"
          fill="none"
          stroke="#c9a24b"
          strokeWidth="1.2"
          opacity="0.85"
        />
        <circle cx="30" cy="42" r="11" fill="#43101a" stroke="#c9a24b" strokeWidth="1.2" />
        <text x="30" y="48" textAnchor="middle" fontSize="15" fill="#c9a24b">
          ?
        </text>
      </svg>
    </div>
  );
}

interface Props {
  card?: Card;
  faceUp?: boolean;
  size?: Size;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  devil?: boolean;
  /** Карта годится под номинал стола — подсвечиваем кромку. */
  matchesTable?: boolean;
  /** Номер для подсказки горячей клавиши. */
  index?: number;
}

/** Карта: рубашка по умолчанию, с анимацией переворота при вскрытии. */
export function PlayingCard({
  card,
  faceUp = false,
  size = "md",
  selected = false,
  onClick,
  disabled = false,
  devil = false,
  matchesTable = false,
  index,
}: Props) {
  const interactive = !!onClick && !disabled;
  const label = card
    ? `${card.rank === "JKR" ? "Джокер" : card.rank}${devil ? ", Дьявол" : ""}${
        selected ? ", выбрана" : ""
      }`
    : "Карта рубашкой вверх";

  return (
    <motion.div
      className={[
        "playing-card",
        `playing-card--${size}`,
        selected ? "is-selected" : "",
        disabled ? "is-disabled" : "",
        interactive ? "is-clickable" : "",
        matchesTable ? "is-match" : "",
        devil ? "is-devil-card" : "",
      ].join(" ")}
      onClick={disabled ? undefined : onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={interactive ? "checkbox" : undefined}
      aria-checked={interactive ? selected : undefined}
      aria-label={interactive ? label : undefined}
      tabIndex={interactive ? 0 : undefined}
      whileHover={interactive ? { y: -14 } : undefined}
      animate={{ rotateY: faceUp ? 0 : 180 }}
      transition={{ duration: 0.45, ease: [0.2, 0.9, 0.25, 1] }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="card-side card-front" style={{ transform: "rotateY(0deg)" }}>
        {card ? (
          <CardFace rank={card.rank} size={size} devil={devil} />
        ) : (
          <CardBack size={size} />
        )}
      </div>
      <div className="card-side" style={{ transform: "rotateY(180deg)" }}>
        <CardBack size={size} />
      </div>
      {index !== undefined && interactive && (
        <span className="playing-card__key" aria-hidden="true">
          {index}
        </span>
      )}
    </motion.div>
  );
}
