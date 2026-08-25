import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";
import { CHAMBERS } from "../game/types";
import {
  cartridgeCountForPull,
  createCartridgeLayout,
} from "../game/revolverVisual";
import type { RouletteStage } from "../game/roulettePresentation";

interface Props {
  stage: RouletteStage;
  pullNumber: number;
  activeSlot: number;
  fired: boolean;
  showFlash: boolean;
  reduceMotion: boolean;
  cylinderStyle: CSSProperties;
}

const CYLINDER_X = 352;
const CYLINDER_Y = 125;
const CHAMBER_RADIUS = 34;
const NOTCH = 360 / CHAMBERS;

export function RealisticRevolver({
  stage,
  pullNumber,
  activeSlot,
  fired,
  showFlash,
  reduceMotion,
  cylinderStyle,
}: Props) {
  const afterImpact = stage === "impact" || stage === "result";
  const cartridgeLayout = createCartridgeLayout({
    pullNumber,
    activeSlot,
    fired,
    afterImpact,
  });
  const cartridgeCount = cartridgeCountForPull(pullNumber);
  const loadingSlots = cartridgeLayout
    .map((state, slot) => ({ state, slot }))
    .filter(({ state }) => state !== "empty");

  const chamberGeometry = Array.from({ length: CHAMBERS }, (_, slot) => {
    const radians = ((slot * NOTCH - 90) * Math.PI) / 180;
    return {
      slot,
      cx: CYLINDER_X + Math.cos(radians) * CHAMBER_RADIUS,
      cy: CYLINDER_Y + Math.sin(radians) * CHAMBER_RADIUS,
    };
  });

  return (
    <svg
      viewBox="-85 0 705 300"
      className="revolver"
      data-cartridge-count={cartridgeCount}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rev-steel-main" x1="0" y1="0" x2="0.08" y2="1">
          <stop offset="0" stopColor="#e2e5e8" />
          <stop offset="0.045" stopColor="#8b9299" />
          <stop offset="0.16" stopColor="#353a40" />
          <stop offset="0.42" stopColor="#111419" />
          <stop offset="0.68" stopColor="#2b3036" />
          <stop offset="0.86" stopColor="#0c0f13" />
          <stop offset="1" stopColor="#030507" />
        </linearGradient>
        <linearGradient id="rev-steel-edge" x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0" stopColor="#080a0d" />
          <stop offset="0.22" stopColor="#5d646b" />
          <stop offset="0.45" stopColor="#191d22" />
          <stop offset="0.72" stopColor="#737a81" />
          <stop offset="1" stopColor="#080a0d" />
        </linearGradient>
        <linearGradient id="rev-steel-rib" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#838a91" />
          <stop offset="0.3" stopColor="#272c31" />
          <stop offset="1" stopColor="#080b0e" />
        </linearGradient>
        <radialGradient id="rev-cylinder" cx="36%" cy="26%" r="78%">
          <stop offset="0" stopColor="#aab0b6" />
          <stop offset="0.13" stopColor="#555c63" />
          <stop offset="0.38" stopColor="#1b1f24" />
          <stop offset="0.68" stopColor="#343a40" />
          <stop offset="0.88" stopColor="#0d1014" />
          <stop offset="1" stopColor="#030405" />
        </radialGradient>
        <radialGradient id="rev-chamber" cx="38%" cy="32%" r="76%">
          <stop offset="0" stopColor="#353a40" />
          <stop offset="0.46" stopColor="#0a0c0f" />
          <stop offset="1" stopColor="#010203" />
        </radialGradient>
        <linearGradient id="rev-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0a5" />
          <stop offset="0.17" stopColor="#d4a248" />
          <stop offset="0.52" stopColor="#8a591f" />
          <stop offset="0.78" stopColor="#c68a32" />
          <stop offset="1" stopColor="#3d220b" />
        </linearGradient>
        <linearGradient id="rev-spent-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a56e2a" />
          <stop offset="0.5" stopColor="#563513" />
          <stop offset="1" stopColor="#1c1006" />
        </linearGradient>
        <linearGradient id="rev-walnut" x1="0" y1="0" x2="0.82" y2="1">
          <stop offset="0" stopColor="#9c5430" />
          <stop offset="0.18" stopColor="#6b321d" />
          <stop offset="0.52" stopColor="#3b1a10" />
          <stop offset="0.78" stopColor="#241009" />
          <stop offset="1" stopColor="#100705" />
        </linearGradient>
        <radialGradient id="rev-grip-light" cx="28%" cy="20%" r="80%">
          <stop offset="0" stopColor="#d1804d" stopOpacity="0.44" />
          <stop offset="0.5" stopColor="#5b2717" stopOpacity="0.12" />
          <stop offset="1" stopColor="#090403" stopOpacity="0.62" />
        </radialGradient>
        <pattern id="rev-checker" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0V8M4 0V8" stroke="#e3a06d" strokeOpacity="0.21" strokeWidth="0.85" />
          <path d="M2 0V8M6 0V8" stroke="#160806" strokeOpacity="0.48" strokeWidth="0.8" />
        </pattern>
        <pattern id="rev-brush" width="17" height="11" patternUnits="userSpaceOnUse">
          <path d="M0 2H17M3 7H13M8 10H17" stroke="#f5f7f8" strokeOpacity="0.035" strokeWidth="0.6" />
        </pattern>
        <filter id="rev-inset" x="-24%" y="-24%" width="148%" height="148%">
          <feDropShadow dx="0" dy="1.8" stdDeviation="1.4" floodColor="#000" floodOpacity="0.94" />
        </filter>
        <filter id="rev-soft-shadow" x="-30%" y="-35%" width="170%" height="185%">
          <feDropShadow dx="4" dy="9" stdDeviation="7" floodColor="#000" floodOpacity="0.72" />
        </filter>
      </defs>

      <ellipse cx="306" cy="276" rx="242" ry="15" fill="#000" opacity="0.36" />

      <g className="revolver__barrel-assembly" filter="url(#rev-soft-shadow)">
        <path
          d="M28 83H300Q315 83 325 94L336 109V139L318 153H31Q17 153 17 139V97Q17 83 28 83Z"
          fill="url(#rev-steel-main)"
          stroke="#030405"
          strokeWidth="4"
        />
        <path d="M31 88H297Q310 88 318 97L321 101H34Q24 101 24 110V96Q24 88 31 88Z" fill="#dfe3e6" opacity="0.16" />
        <path d="M53 147H321L303 171H84Q63 171 53 147Z" fill="url(#rev-steel-edge)" stroke="#030405" strokeWidth="3" />
        <path d="M77 153H294" stroke="#a2a8ae" strokeOpacity="0.32" strokeWidth="2.2" />
        <path d="M71 170H292" stroke="#030405" strokeWidth="5.5" strokeLinecap="round" />
        <circle cx="72" cy="170" r="5.3" fill="#252a2f" stroke="#9aa0a6" strokeWidth="1.6" />

        <path d="M34 80L54 68H286L307 81Z" fill="url(#rev-steel-rib)" stroke="#030405" strokeWidth="3" />
        {[88, 132, 176, 220].map((x) => (
          <path key={x} d={`M${x} 72H${x + 22}L${x + 27} 79H${x - 5}Z`} fill="#080a0d" stroke="#555c62" strokeWidth="1" />
        ))}
        <path d="M59 67V54H78L83 68Z" fill="url(#rev-steel-rib)" stroke="#05070a" strokeWidth="2.4" />
        <path d="M63 56H75" stroke="#b7bdc3" strokeOpacity="0.55" strokeWidth="2" />

        <rect x="11" y="88" width="22" height="60" rx="8" fill="#0b0e11" stroke="#60676e" strokeWidth="2.5" />
        <ellipse cx="16" cy="118" rx="10" ry="23" fill="#020304" stroke="#24292e" strokeWidth="3" />
        <ellipse cx="18" cy="118" rx="5.8" ry="16" fill="#000" stroke="#5b6268" strokeOpacity="0.44" strokeWidth="1.4" />

        <motion.path
          d="M45 91H284"
          stroke="#f3f5f6"
          strokeWidth="2.2"
          strokeLinecap="round"
          animate={{ opacity: showFlash ? [0.18, 0.9, 0.12] : [0.09, 0.24, 0.09] }}
          transition={{ duration: showFlash ? 0.34 : 2.2, repeat: showFlash ? 0 : Infinity }}
        />
        <path d="M112 132H261" stroke="#020304" strokeOpacity="0.68" strokeWidth="1" />
        <text x="119" y="127" fill="#9ba1a6" opacity="0.58" fontSize="8.5" letterSpacing="2.1">LIAR&apos;S BAR · .357</text>
        <path d="M32 83H301Q315 83 324 95" fill="none" stroke="url(#rev-brush)" strokeWidth="8" opacity="0.5" />
      </g>

      <g className="revolver__frame">
        <path
          d="M291 79Q309 60 342 58H414Q441 59 454 78L474 108L467 149Q464 171 444 184L414 191H387L374 177H315L286 153L277 118L284 93Z"
          fill="url(#rev-steel-main)"
          stroke="#030405"
          strokeWidth="4.2"
        />
        <path d="M305 76Q322 65 346 65H410Q429 65 439 77" fill="none" stroke="#eef0f2" strokeOpacity="0.22" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M424 73Q446 85 457 111L450 157Q444 171 426 177" fill="none" stroke="#05070a" strokeWidth="4" />
        <path d="M289 150Q320 176 373 169" fill="none" stroke="#777e84" strokeOpacity="0.36" strokeWidth="2.5" />
        <path d="M290 85H444" stroke="#fff" strokeOpacity="0.05" strokeWidth="12" />
        <circle cx="434" cy="135" r="5.2" fill="#111419" stroke="#8e959b" strokeWidth="1.5" />
        <path d="M427 134H441" stroke="#454b50" strokeWidth="1.3" />
      </g>

      <g className="revolver__trigger-assembly">
        <path d="M392 174Q393 218 421 222Q448 224 457 187" fill="none" stroke="#050608" strokeWidth="14" strokeLinecap="round" />
        <path d="M393 175Q397 211 422 215Q443 217 449 188" fill="none" stroke="#737a80" strokeOpacity="0.52" strokeWidth="2.4" />
        <motion.path
          d="M430 181Q416 192 421 210"
          fill="none"
          stroke="#aeb3b7"
          strokeWidth="5"
          strokeLinecap="round"
          animate={{ rotate: stage === "impact" ? 15 : 0 }}
          transition={{ duration: 0.13 }}
          style={{ transformBox: "fill-box", transformOrigin: "top center" }}
        />
      </g>

      <g className="revolver__grip">
        <path
          d="M422 173Q448 178 468 197Q482 210 491 230L516 272Q524 288 507 295Q477 301 438 294Q418 290 421 272L438 205Z"
          fill="url(#rev-steel-edge)"
          stroke="#030405"
          strokeWidth="4.2"
        />
        <path
          d="M444 190Q462 194 477 209Q488 221 494 238L507 270Q512 282 500 287Q474 292 445 286Q432 283 435 269L448 211Z"
          fill="url(#rev-walnut)"
          stroke="#160a07"
          strokeWidth="3"
        />
        <path
          d="M448 202Q463 207 474 220Q482 232 486 248L496 270Q500 279 490 281Q470 284 450 279Q443 277 445 267L452 220Z"
          fill="url(#rev-checker)"
          opacity="0.84"
        />
        <path d="M444 191Q464 195 479 212Q487 221 492 233" fill="none" stroke="#e7a06c" strokeOpacity="0.34" strokeWidth="2.7" />
        <path d="M440 270Q458 257 496 268" fill="none" stroke="#d07b49" strokeOpacity="0.2" strokeWidth="2.1" />
        <path d="M438 279Q461 267 504 278" fill="none" stroke="#1b0a06" strokeOpacity="0.55" strokeWidth="1.7" />
        <path d="M444 190Q462 194 477 209Q488 221 494 238L507 270Q512 282 500 287Q474 292 445 286Q432 283 435 269L448 211Z" fill="url(#rev-grip-light)" />
        <circle cx="472" cy="236" r="7" fill="#21110b" stroke="#c98552" strokeWidth="1.8" />
        <circle cx="472" cy="236" r="3.1" fill="#8e5635" stroke="#2a130b" strokeWidth="1" />
        <path d="M470 233V239H475" fill="none" stroke="#e1aa7d" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M431 287Q465 299 509 289" fill="none" stroke="#aeb3b8" strokeOpacity="0.68" strokeWidth="4.2" strokeLinecap="round" />
        <path d="M438 203L423 272Q420 286 434 290" fill="none" stroke="#8b9298" strokeOpacity="0.45" strokeWidth="2.4" />
      </g>

      <g className="revolver__crane">
        <path d="M323 150Q307 184 332 199H383" fill="none" stroke="#0b0e11" strokeWidth="13" strokeLinecap="round" />
        <path d="M324 151Q312 181 334 192H382" fill="none" stroke="#858c92" strokeOpacity="0.42" strokeWidth="2.6" />
        <circle cx="384" cy="194" r="5.5" fill="#191d21" stroke="#858c92" strokeOpacity="0.7" strokeWidth="1.4" />
      </g>

      <circle cx={CYLINDER_X + 8} cy={CYLINDER_Y + 1} r="61" fill="#050608" stroke="#666d73" strokeWidth="2.2" opacity="0.96" />
      <g
        className={`revolver__cylinder ${stage === "spin" ? `is-spinning ${pullNumber === 1 ? "is-first-spin" : "is-indexing"}` : ""}`}
        data-testid="revolver-cylinder"
        style={cylinderStyle}
      >
        <circle cx={CYLINDER_X} cy={CYLINDER_Y} r="58" fill="url(#rev-cylinder)" stroke="#030405" strokeWidth="4" />
        <circle cx={CYLINDER_X} cy={CYLINDER_Y} r="54" fill="none" stroke="#c3c8cc" strokeOpacity="0.28" strokeWidth="1.5" />
        <circle cx={CYLINDER_X} cy={CYLINDER_Y} r="45" fill="none" stroke="#07090b" strokeWidth="1.6" strokeDasharray="2 4" />

        {chamberGeometry.map(({ slot, cx, cy }) => {
          const cartridge = cartridgeLayout[slot];
          const hasCartridge = cartridge !== "empty";
          return (
            <g
              key={slot}
              className="revolver__chamber"
              data-chamber={slot}
              data-cartridge={cartridge}
              filter="url(#rev-inset)"
            >
              <circle cx={cx} cy={cy} r="12.4" fill="url(#rev-chamber)" stroke="#8b9298" strokeOpacity="0.58" strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r="9.8" fill="#020304" stroke="#15191d" strokeWidth="1.2" />
              {hasCartridge && (
                <motion.g
                  initial={stage === "load" && !reduceMotion ? { opacity: 0, scale: 0.3 } : false}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: stage === "load" ? slot * 0.065 + 0.42 : 0, duration: 0.22 }}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                >
                  <circle cx={cx} cy={cy} r="9.2" fill={cartridge === "spent" ? "url(#rev-spent-brass)" : "url(#rev-brass)"} stroke="#4a2a0c" strokeWidth="1.2" />
                  <circle cx={cx} cy={cy} r="3.2" fill={cartridge === "spent" ? "#160d06" : "#f5d47b"} stroke="#6a4215" strokeWidth="1" />
                  {cartridge === "spent" && <path d={`M${cx - 3.2} ${cy - 3}L${cx + 3.3} ${cy + 3.1}M${cx + 3.1} ${cy - 3.2}L${cx - 3.1} ${cy + 3.2}`} stroke="#090502" strokeWidth="1.15" opacity="0.9" />}
                  <path d={`M${cx - 5.8} ${cy - 5.1}Q${cx} ${cy - 7.8} ${cx + 5.3} ${cy - 4.8}`} fill="none" stroke="#fff1ab" strokeOpacity="0.48" strokeWidth="1.1" />
                </motion.g>
              )}
            </g>
          );
        })}

        <circle cx={CYLINDER_X} cy={CYLINDER_Y} r="13" fill="url(#rev-steel-edge)" stroke="#06080a" strokeWidth="2.4" />
        <circle cx={CYLINDER_X} cy={CYLINDER_Y} r="4.1" fill="#aab0b5" stroke="#171b1f" strokeWidth="1.2" />
        {Array.from({ length: CHAMBERS }, (_, slot) => (
          <path
            key={`ratchet-${slot}`}
            d="M349 110L352 104L355 110"
            fill="#727980"
            stroke="#0b0d10"
            strokeWidth="0.8"
            transform={`rotate(${slot * NOTCH} ${CYLINDER_X} ${CYLINDER_Y})`}
          />
        ))}
      </g>

      <path d="M343 54H361L352 66Z" fill="#c7a85d" stroke="#513813" strokeWidth="1.3" filter="drop-shadow(0 0 3px rgba(245,207,116,.55))" />
      <path d="M431 109L447 107L450 121L435 124Z" fill="#101317" stroke="#8d949a" strokeWidth="1.8" />
      <circle cx="441" cy="116" r="3" fill="#aeb4b9" />

      <AnimatePresence>
        {stage === "load" &&
          loadingSlots.map(({ slot }, order) => {
            const target = chamberGeometry[slot];
            return (
              <motion.g
                key={`loading-${pullNumber}-${slot}`}
                className="revolver__loading-cartridge"
                data-testid="loading-cartridge"
                initial={{ x: 545 + order * 7, y: 267 - order * 7, rotate: 30, opacity: 0, scale: 1 }}
                animate={
                  reduceMotion
                    ? { x: target.cx, y: target.cy + 18, rotate: 0, opacity: 0, scale: 0.5 }
                    : {
                        x: [545 + order * 7, target.cx + 82, target.cx + 5],
                        y: [267 - order * 7, target.cy + 60, target.cy + 20],
                        rotate: [30, 11, -16],
                        opacity: [0, 1, 1, 0],
                        scale: [1, 0.8, 0.48],
                      }
                }
                transition={{ duration: 0.68, delay: order * 0.065, ease: [0.18, 0.8, 0.22, 1] }}
              >
                <path d="M-5 -20H5L6 10H-6Z" fill="url(#rev-brass)" stroke="#4c2c0d" strokeWidth="1.2" />
                <path d="M-5 -20L-2.5 -28H2.5L5 -20Z" fill="#934d22" stroke="#351c0b" strokeWidth="1" />
                <ellipse cx="0" cy="10" rx="6.4" ry="3" fill="#b77a2e" stroke="#4a2a0c" strokeWidth="1" />
                <path d="M-2.4 -17V5" stroke="#fff0a6" strokeOpacity="0.62" strokeWidth="1.2" />
              </motion.g>
            );
          })}
      </AnimatePresence>

      <motion.g
        className="revolver__hammer"
        style={{ transformBox: "view-box", transformOrigin: "442px 89px" }}
        animate={{ rotate: stage === "load" ? 0 : stage === "cock" || stage === "spin" || stage === "aim" ? -30 : stage === "impact" ? 14 : 2 }}
        transition={{ duration: stage === "cock" ? 0.5 : 0.14, ease: "easeOut" }}
      >
        <path d="M438 80L465 52L481 53L479 68L455 91Z" fill="url(#rev-steel-main)" stroke="#030405" strokeWidth="3" />
        <path d="M460 58L477 57" stroke="#c5cacf" strokeOpacity="0.4" strokeWidth="2" />
        <path d="M466 54L478 66M471 53L481 61" stroke="#050608" strokeWidth="1.2" />
      </motion.g>

      <AnimatePresence>
        {showFlash && (
          <motion.g
            key="flash"
            data-testid="muzzle-flash"
            initial={{ opacity: 0, scale: 0.18 }}
            animate={{ opacity: [0, 1, 0.9, 0], scale: [0.18, 1.32, 0.96, 0.58], rotate: [0, -4, 2, 0] }}
            transition={{ duration: 0.48, ease: "easeOut" }}
            style={{ transformBox: "view-box", transformOrigin: "15px 118px" }}
          >
            <path d="M18 118L-53 71L-28 108L-78 118L-29 129L-58 174Z" fill="#e77718" />
            <path d="M18 118L-39 91L-17 118L-42 147Z" fill="#ffc64d" />
            <path d="M18 118L-24 108L-8 118L-25 130Z" fill="#fff8cf" />
            <circle cx="15" cy="118" r="18" fill="#fff1a3" opacity="0.9" />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}
