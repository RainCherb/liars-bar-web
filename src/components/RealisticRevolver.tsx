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

const CYLINDER_X = 198;
const CYLINDER_Y = 88;
const CHAMBER_RADIUS = 23;
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
      viewBox="-58 0 432 210"
      className="revolver"
      data-cartridge-count={cartridgeCount}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gunmetal" x1="0" y1="0" x2="0.12" y2="1">
          <stop offset="0" stopColor="#a8adb5" />
          <stop offset="0.08" stopColor="#50545c" />
          <stop offset="0.34" stopColor="#17191e" />
          <stop offset="0.62" stopColor="#343840" />
          <stop offset="0.82" stopColor="#111318" />
          <stop offset="1" stopColor="#050609" />
        </linearGradient>
        <linearGradient id="gunmetal-edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#111318" />
          <stop offset="0.36" stopColor="#747983" />
          <stop offset="0.55" stopColor="#25282e" />
          <stop offset="1" stopColor="#08090c" />
        </linearGradient>
        <radialGradient id="cylinder-steel" cx="38%" cy="28%" r="78%">
          <stop offset="0" stopColor="#858b95" />
          <stop offset="0.22" stopColor="#40444c" />
          <stop offset="0.62" stopColor="#181a20" />
          <stop offset="0.88" stopColor="#2c3037" />
          <stop offset="1" stopColor="#090a0d" />
        </radialGradient>
        <radialGradient id="chamber-dark" cx="36%" cy="30%" r="75%">
          <stop offset="0" stopColor="#30343a" />
          <stop offset="0.5" stopColor="#0b0c0f" />
          <stop offset="1" stopColor="#020304" />
        </radialGradient>
        <linearGradient id="cartridge-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff1a8" />
          <stop offset="0.2" stopColor="#d9a344" />
          <stop offset="0.62" stopColor="#8d581d" />
          <stop offset="1" stopColor="#3e240c" />
        </linearGradient>
        <linearGradient id="spent-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b27a31" />
          <stop offset="0.55" stopColor="#664016" />
          <stop offset="1" stopColor="#241407" />
        </linearGradient>
        <linearGradient id="walnut" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8d4c28" />
          <stop offset="0.28" stopColor="#4d2415" />
          <stop offset="0.7" stopColor="#2c120c" />
          <stop offset="1" stopColor="#120806" />
        </linearGradient>
        <pattern id="grip-checker" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0V7M3.5 0V7" stroke="#d38a4d" strokeOpacity="0.24" strokeWidth="0.7" />
        </pattern>
        <filter id="metal-inset" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1.1" floodColor="#000" floodOpacity="0.92" />
        </filter>
      </defs>

      <ellipse cx="198" cy="190" rx="150" ry="11" fill="#000" opacity="0.34" />

      <g className="revolver__barrel-assembly">
        <path
          d="M17 64H178L190 72V98L176 105H17Q9 105 9 97V72Q9 64 17 64Z"
          fill="url(#gunmetal)"
          stroke="#050609"
          strokeWidth="3"
        />
        <path d="M19 68H174L181 74H21Q15 74 15 80V72Q15 68 19 68Z" fill="#d7dbe1" opacity="0.2" />
        <path d="M45 102H180L170 117H64Q50 117 45 102Z" fill="url(#gunmetal-edge)" stroke="#08090c" strokeWidth="2.4" />
        <path d="M55 106H161" stroke="#8d929c" strokeOpacity="0.32" strokeWidth="2" />
        <rect x="7" y="68" width="16" height="33" rx="5" fill="#08090c" stroke="#555a64" strokeWidth="1.5" />
        <ellipse cx="10" cy="84.5" rx="6" ry="12" fill="#020304" stroke="#24272d" strokeWidth="2" />
        <path d="M25 62L44 57H63L68 64H25Z" fill="url(#gunmetal-edge)" stroke="#08090c" strokeWidth="2" />
        <path d="M40 57V51H52V57" fill="#121419" stroke="#777d87" strokeWidth="1.2" />
        <path d="M101 67L158 67" stroke="#eef1f5" strokeOpacity="0.22" strokeWidth="2" strokeLinecap="round" />
        <circle cx="92" cy="110" r="3.6" fill="#15171b" stroke="#818690" strokeWidth="1" />
        <path d="M63 116H169" stroke="#06070a" strokeWidth="4" strokeLinecap="round" />
        <circle cx="61" cy="116" r="4" fill="#25282e" stroke="#8b9099" strokeWidth="1.2" />
      </g>

      <path
        d="M168 54Q177 45 204 44H246Q262 45 270 57L279 79L269 112Q264 121 249 124H221L207 116H174L160 103V70Z"
        fill="url(#gunmetal)"
        stroke="#050609"
        strokeWidth="3.4"
      />
      <path d="M222 48H245Q255 49 261 58L268 76" fill="none" stroke="#d6dae0" strokeOpacity="0.2" strokeWidth="3" strokeLinecap="round" />
      <path d="M172 108Q188 120 212 116" fill="none" stroke="#777c86" strokeOpacity="0.32" strokeWidth="2" />

      <path d="M171 112Q181 132 210 131L231 118" fill="none" stroke="#090a0d" strokeWidth="10" strokeLinecap="round" />
      <path d="M171 112Q181 128 208 127L227 116" fill="none" stroke="#777c85" strokeWidth="2" strokeOpacity="0.48" />
      <motion.path
        d="M218 111Q207 119 210 132"
        fill="none"
        stroke="#a2a7b0"
        strokeWidth="4"
        strokeLinecap="round"
        animate={{ rotate: stage === "impact" ? 13 : 0 }}
        transition={{ duration: 0.12 }}
        style={{ transformBox: "fill-box", transformOrigin: "top center" }}
      />

      <path d="M246 113Q267 122 282 146L310 190Q315 199 303 203H231Q218 201 222 188L235 132Z" fill="url(#gunmetal-edge)" stroke="#050609" strokeWidth="3.4" />
      <path d="M248 122Q266 131 278 151L299 188Q302 193 294 195H236Q229 194 231 186L242 136Z" fill="url(#walnut)" stroke="#130806" strokeWidth="2.4" />
      <path d="M249 131Q262 138 272 155L291 189H239L247 145Z" fill="url(#grip-checker)" opacity="0.9" />
      <path d="M244 128Q257 131 267 143" fill="none" stroke="#edb079" strokeOpacity="0.25" strokeWidth="2" />
      <circle cx="264" cy="170" r="4.2" fill="#22120b" stroke="#b16d3d" strokeWidth="1.2" />
      <path d="M233 197H306" stroke="#7e838d" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />

      <path d="M183 111Q179 121 183 130" fill="none" stroke="#757a84" strokeWidth="4" strokeLinecap="round" />
      <path d="M178 111L168 126" stroke="#111318" strokeWidth="4" strokeLinecap="round" />

      <g className="revolver__crane">
        <path d="M180 94Q176 115 190 124H218" fill="none" stroke="#15171b" strokeWidth="9" strokeLinecap="round" />
        <path d="M181 96Q179 112 191 119H216" fill="none" stroke="#777c86" strokeOpacity="0.45" strokeWidth="2" />
        <circle cx="217" cy="120" r="6" fill="#1c1f24" stroke="#777c86" strokeWidth="1.4" />
      </g>

      <circle cx="198" cy="88" r="42" fill="#090a0d" stroke="#5e636d" strokeWidth="2" opacity="0.9" />
      <g
        className={`revolver__cylinder ${stage === "spin" ? `is-spinning ${pullNumber === 1 ? "is-first-spin" : "is-indexing"}` : ""}`}
        data-testid="revolver-cylinder"
        style={cylinderStyle}
      >
        <circle cx={CYLINDER_X} cy={CYLINDER_Y} r="39" fill="url(#cylinder-steel)" stroke="#050609" strokeWidth="3" />
        <circle cx={CYLINDER_X} cy={CYLINDER_Y} r="35" fill="none" stroke="#a2a7b0" strokeOpacity="0.38" strokeWidth="1.2" />
        <circle cx={CYLINDER_X} cy={CYLINDER_Y} r="29" fill="none" stroke="#090a0d" strokeWidth="1.4" strokeDasharray="2 3" />

        {chamberGeometry.map(({ slot, cx, cy }) => {
          const cartridge = cartridgeLayout[slot];
          const hasCartridge = cartridge !== "empty";
          return (
            <g
              key={slot}
              className="revolver__chamber"
              data-chamber={slot}
              data-cartridge={cartridge}
              filter="url(#metal-inset)"
            >
              <circle cx={cx} cy={cy} r="8.2" fill="url(#chamber-dark)" stroke="#777d87" strokeOpacity="0.55" strokeWidth="1.2" />
              <circle cx={cx} cy={cy} r="6.55" fill="#020304" stroke="#111318" strokeWidth="1" />
              {hasCartridge && (
                <motion.g
                  initial={stage === "load" && !reduceMotion ? { opacity: 0, scale: 0.35 } : false}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: stage === "load" ? slot * 0.055 + 0.2 : 0, duration: 0.2 }}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                >
                  <circle cx={cx} cy={cy} r="6" fill={cartridge === "spent" ? "url(#spent-brass)" : "url(#cartridge-brass)"} stroke="#4c2c0d" strokeWidth="1" />
                  <circle cx={cx} cy={cy} r="2.05" fill={cartridge === "spent" ? "#1a1008" : "#f5d67d"} stroke="#6e4516" strokeWidth="0.8" />
                  {cartridge === "spent" && <path d={`M${cx - 2.4} ${cy - 2.2}L${cx + 2.5} ${cy + 2.3}M${cx + 2.3} ${cy - 2.4}L${cx - 2.3} ${cy + 2.4}`} stroke="#090603" strokeWidth="0.8" opacity="0.8" />}
                  <path d={`M${cx - 3.8} ${cy - 3.5}Q${cx} ${cy - 5.1} ${cx + 3.5} ${cy - 3.1}`} fill="none" stroke="#fff0a8" strokeOpacity="0.5" strokeWidth="0.8" />
                </motion.g>
              )}
            </g>
          );
        })}

        <circle cx={CYLINDER_X} cy={CYLINDER_Y} r="8" fill="url(#gunmetal-edge)" stroke="#090a0d" strokeWidth="2" />
        <circle cx={CYLINDER_X} cy={CYLINDER_Y} r="2.4" fill="#aeb3bc" />
        <path d="M194 88H202M198 84V92" stroke="#17191e" strokeWidth="1.3" />
        <path d="M194 50Q198 47 202 50" fill="none" stroke="#f4d16d" strokeWidth="1.6" />
      </g>

      <path d="M191 39H205L198 49Z" fill="#d8b45d" stroke="#4f3515" strokeWidth="1" filter="drop-shadow(0 0 3px rgba(255,216,120,.7))" />
      <path d="M241 79L252 78L254 87L244 90Z" fill="#121419" stroke="#8b9099" strokeWidth="1.5" />
      <circle cx="248" cy="84" r="2.1" fill="#b2b7c0" />

      <AnimatePresence>
        {stage === "load" &&
          loadingSlots.map(({ slot }, order) => {
            const geometry = chamberGeometry[slot];
            return (
              <motion.g
                key={`loading-${pullNumber}-${slot}`}
                className="revolver__loading-cartridge"
                data-testid="loading-cartridge"
                initial={{ x: 332 + order * 5, y: 164 - order * 8, rotate: 34, opacity: 0, scale: 0.94 }}
                animate={
                  reduceMotion
                    ? { x: geometry.cx + 30, y: geometry.cy, rotate: 0, opacity: 0, scale: 0.5 }
                    : {
                        x: [332 + order * 5, geometry.cx + 72, geometry.cx + 30],
                        y: [164 - order * 8, geometry.cy + 38, geometry.cy],
                        rotate: [34, 13, 0],
                        opacity: [0, 1, 1, 0],
                        scale: [0.94, 0.78, 0.48],
                      }
                }
                transition={{ duration: 0.52, delay: order * 0.055, ease: [0.2, 0.82, 0.25, 1] }}
              >
                <path d="M-4 -15H4L5 8H-5Z" fill="url(#cartridge-brass)" stroke="#4c2c0d" strokeWidth="1" />
                <path d="M-4 -15L-2 -21H2L4 -15Z" fill="#8e4d22" stroke="#3b210d" strokeWidth="0.8" />
                <ellipse cx="0" cy="8" rx="5.4" ry="2.6" fill="#bb7d2e" stroke="#4c2c0d" strokeWidth="0.9" />
                <path d="M-2 -12V4" stroke="#fff0a8" strokeOpacity="0.65" strokeWidth="1" />
              </motion.g>
            );
          })}
      </AnimatePresence>

      <motion.path
        d="M252 53L269 41L276 43L273 61L260 69Z"
        fill="url(#gunmetal)"
        stroke="#050609"
        strokeWidth="2.3"
        style={{ transformBox: "view-box", transformOrigin: "258px 66px" }}
        animate={{ rotate: stage === "load" ? 0 : stage === "cock" || stage === "spin" || stage === "aim" ? -28 : stage === "impact" ? 14 : 2 }}
        transition={{ duration: stage === "cock" ? 0.46 : 0.14, ease: "easeOut" }}
      />
      <path d="M258 50L269 45" stroke="#c9cdd4" strokeOpacity="0.35" strokeWidth="1.4" />

      <AnimatePresence>
        {showFlash && (
          <motion.g
            key="flash"
            data-testid="muzzle-flash"
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 1, 0.86, 0], scale: [0.2, 1.35, 0.92, 0.55], rotate: [0, -5, 3, 0] }}
            transition={{ duration: 0.46, ease: "easeOut" }}
            style={{ transformBox: "view-box", transformOrigin: "9px 84px" }}
          >
            <path d="M10 84L-45 48L-25 78L-58 84L-25 91L-47 121Z" fill="#f28b1d" />
            <path d="M10 84L-34 66L-15 84L-34 103Z" fill="#ffd767" />
            <path d="M10 84L-20 76L-8 84L-20 93Z" fill="#fffbe2" />
            <circle cx="8" cy="84" r="13" fill="#fff0ad" opacity="0.88" />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}
