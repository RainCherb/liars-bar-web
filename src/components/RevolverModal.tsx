import { useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CHAMBERS } from "../game/types";
import { sfx } from "../game/sounds";
import {
  ROULETTE_STAGE_MS,
  type RouletteStage,
} from "../game/roulettePresentation";

interface Props {
  open: boolean;
  paused?: boolean;
  shooterName: string;
  fired: boolean;
  /** Номер спуска для стрелка (1..6). */
  pullNumber: number;
  /** Гнёзд оставалось до спуска (6..1): шанс выстрела 1 из N. */
  remainingChambers: number;
  /** Порядок в серии выстрелов (вариант «Дьявол»). */
  index: number;
  total: number;
  /** Только для детерминированной локальной QA-сцены. */
  stageOverride?: RouletteStage;
}

const mod = (value: number, divisor: number) =>
  ((value % divisor) + divisor) % divisor;

const SPARKS = [
  [-42, -26],
  [-54, -9],
  [-48, 12],
  [-35, 29],
  [-68, 4],
  [-29, -40],
  [-62, -24],
  [-21, 39],
] as const;

const BLOOD_DROPS = [
  [16, 24, 13, -18, -34, 20],
  [23, 35, 8, -42, -6, 45],
  [30, 18, 10, 12, -48, 70],
  [38, 29, 6, 48, -20, 95],
  [19, 51, 7, -35, 42, 115],
  [33, 58, 11, 28, 54, 135],
  [46, 43, 5, 64, 18, 155],
  [11, 66, 8, -24, 70, 175],
  [52, 23, 6, 78, -38, 195],
] as const;

/**
 * Кинематографическая, но механически честная сцена русской рулетки.
 * Активное гнездо находится у верхней метки: боевой патрон приходит к ней
 * только при настоящем выстреле. При осечке под ударником остаётся пустое гнездо.
 */
export function RevolverModal({
  open,
  paused = false,
  shooterName,
  fired,
  pullNumber,
  remainingChambers,
  index,
  total,
  stageOverride,
}: Props) {
  const sceneId = `${shooterName}-${pullNumber}-${index}`;
  const [scene, setScene] = useState<{ id: string; stage: RouletteStage }>({
    id: "",
    stage: "load",
  });
  const reduceMotion = useReducedMotion();
  const stage: RouletteStage =
    stageOverride ?? (scene.id === sceneId ? scene.stage : "load");

  useEffect(() => {
    if (stageOverride) {
      setScene({ id: sceneId, stage: stageOverride });
      return;
    }
    if (!open || paused) {
      setScene({ id: "", stage: "load" });
      return;
    }

    setScene({ id: sceneId, stage: "load" });
    sfx.play("reload");

    let elapsed = ROULETTE_STAGE_MS.load;
    const timers: number[] = [];
    const schedule = (
      nextStage: RouletteStage,
      sound?: "cock" | "spin" | "gunshot" | "dryClick",
    ) => {
      timers.push(
        window.setTimeout(() => {
          setScene({ id: sceneId, stage: nextStage });
          if (sound) sfx.play(sound);
        }, elapsed),
      );
      elapsed += ROULETTE_STAGE_MS[nextStage];
    };

    schedule("cock", "cock");
    schedule("spin", "spin");
    schedule("aim");
    schedule("impact", fired ? "gunshot" : "dryClick");
    schedule("result");

    return () => timers.forEach(window.clearTimeout);
  }, [open, paused, sceneId, fired, stageOverride]);

  const spent = CHAMBERS - remainingChambers;
  const notch = 360 / CHAMBERS;
  const baseRotation = spent * notch;
  const finalRotation = baseRotation + notch;
  const activeSlot = mod(Math.round(-finalRotation / notch), CHAMBERS);
  // Для осечки патрон остаётся в другом гнезде и никогда не рисуется под ударником.
  const bulletSlot = fired ? activeSlot : mod(activeSlot + 2, CHAMBERS);
  const afterSpin = stage === "aim" || stage === "impact" || stage === "result";
  const showFlash = fired && stage === "impact";
  const showSmoke = fired && (stage === "impact" || stage === "result");
  const showBlood = fired && (stage === "impact" || stage === "result");
  const showDryPulse = !fired && stage === "impact";
  const firstLoading = pullNumber === 1;
  const cylinderStyle = {
    "--cylinder-from": `${baseRotation}deg`,
    "--cylinder-to": `${finalRotation}deg`,
    transform:
      stage === "load" && firstLoading
        ? `translateX(23px) rotate(${baseRotation}deg)`
        : `rotate(${afterSpin ? finalRotation : baseRotation}deg)`,
  } as CSSProperties;

  const fullGunMotion =
    stage === "load"
      ? { x: 58, y: 34, rotate: 4, scale: 0.9, opacity: 1 }
      : stage === "cock"
        ? { x: [58, -12, -6], y: [34, -20, -16], rotate: [4, -9, -7], scale: [0.9, 1.06, 1.03], opacity: 1 }
        : stage === "spin"
          ? { x: [-6, -13, 2, -9, -5], y: -16, rotate: [-7, -10, -4, -8, -7], scale: 1.03, opacity: 1 }
          : stage === "aim"
            ? { x: [-5, -18, -8], y: [-16, -30, -23], rotate: [-7, -11, -8], scale: 1.06, opacity: 1 }
            : stage === "impact" && fired
              ? { x: [-8, 66, -38, 20, -13, -7], y: [-23, -62, -4, -34, -17, -22], rotate: [-8, -24, 5, -15, -5, -8], scale: [1.06, 1.14, 0.96, 1.06, 1.01, 1.03], opacity: 1 }
              : stage === "impact"
                ? { x: [-8, 16, -12, 8, -7], y: [-23, -27, -20, -25, -23], rotate: [-8, -12, -5, -10, -8], scale: [1.06, 1.03, 1.055, 1.035, 1.04], opacity: 1 }
                : { x: -7, y: -22, rotate: -8, scale: 1.03, opacity: 1 };

  const gunMotion = reduceMotion
    ? { x: 0, y: 0, rotate: 0, scale: stage === "impact" ? (fired ? 1.04 : 0.99) : 1, opacity: 1 }
    : fullGunMotion;

  const gunDuration =
    stage === "spin" ? 1.62 : stage === "impact" ? (fired ? 0.58 : 0.46) : 0.48;

  return (
    <AnimatePresence>
      {open && !paused && (
        <motion.div
          className={`overlay overlay--roulette ${showFlash ? "is-bang" : ""} ${showDryPulse ? "is-dry" : ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          data-stage={stage}
          data-outcome={fired ? "fired" : "dry"}
          data-pull={pullNumber}
          data-reduced-motion={reduceMotion ? "true" : "false"}
          role="alertdialog"
          aria-label="Русская рулетка"
        >
          <AnimatePresence>
            {showBlood && (
              <motion.div
                key={`blood-${sceneId}`}
                className="roulette__blood"
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="roulette__blood-splash" />
                {BLOOD_DROPS.map(([left, top, size, x, y, delay], drop) => (
                  <i
                    key={drop}
                    className="roulette__blood-drop"
                    style={
                      {
                        "--blood-left": `${left}%`,
                        "--blood-top": `${top}%`,
                        "--blood-size": `${size}px`,
                        "--blood-x": `${x}px`,
                        "--blood-y": `${y}px`,
                        "--blood-delay": `${delay}ms`,
                      } as CSSProperties
                    }
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div className="roulette" initial={{ scale: 0.92, y: 18 }} animate={{ scale: 1, y: 0 }}>
            <p className="roulette__title">
              Русская рулетка
              {total > 1 && <span className="roulette__series"> · спуск {index} из {total}</span>}
            </p>
            <p className="roulette__who">У револьвера: <b>{shooterName}</b></p>
            <motion.p
              key={`${pullNumber}-${index}`}
              className={`roulette__bullets ${remainingChambers <= 3 ? "is-hot" : ""}`}
              initial={{ scale: 0.72, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              Спуск №{pullNumber} · {remainingChambers > 1 ? `риск выстрела — 1 из ${remainingChambers}` : "выстрел неизбежен"}
            </motion.p>

            <div className="roulette__scene">
              <div className={`roulette__reticle ${stage === "aim" ? "is-visible" : ""}`} aria-hidden="true" />
              <motion.div
                key={sceneId}
                className="revolver-wrap"
                initial={reduceMotion ? { scale: 0.96, opacity: 0 } : { x: 250, y: 94, rotate: 20, scale: 0.62, opacity: 0 }}
                animate={gunMotion}
                transition={{ duration: reduceMotion ? 0.24 : gunDuration, ease: [0.2, 0.85, 0.25, 1] }}
              >
                <svg viewBox="0 0 280 170" className="revolver" aria-hidden="true">
                  <defs>
                    <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#5b5e68" /><stop offset="0.38" stopColor="#23242a" /><stop offset="0.72" stopColor="#3c3e47" /><stop offset="1" stopColor="#17181d" />
                    </linearGradient>
                    <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#fff0a3" /><stop offset="0.38" stopColor="#d89d35" /><stop offset="1" stopColor="#714315" />
                    </linearGradient>
                  </defs>

                  <rect x="14" y="70" width="130" height="25" rx="6" fill="url(#steel)" stroke="#0b0b0e" strokeWidth="3" />
                  <motion.rect x="20" y="74" width="116" height="4" rx="2" fill="#d7d9e1" opacity="0.38" animate={{ opacity: showFlash ? [0.35, 1, 0.2] : [0.2, 0.48, 0.2] }} transition={{ duration: showFlash ? 0.28 : 1.8, repeat: showFlash ? 0 : Infinity }} />
                  <rect x="8" y="68" width="14" height="29" rx="3" fill="#15161b" stroke="#050507" strokeWidth="2" />
                  <path d="M132 62 L197 62 L214 120 Q220 150 190 157 L149 160 L149 108 Z" fill="url(#steel)" stroke="#09090c" strokeWidth="3" />
                  <path d="M151 96 L185 96 L178 119 L151 120 Z" fill="#492b1c" stroke="#120b08" strokeWidth="2" />
                  <path d="M154 100 Q150 130 169 130 L187 130" fill="none" stroke="#101116" strokeWidth="4" />
                  <motion.path d="M160 104 L159 118 Q159 124 166 124" fill="none" stroke="#8b8e97" strokeWidth="3" animate={{ rotate: stage === "impact" ? 12 : 0 }} style={{ transformBox: "fill-box", transformOrigin: "top center" }} />

                  <g>
                    <circle cx="150" cy="78" r="31" fill="#1c1d22" stroke="#09090c" strokeWidth="3" />
                    <g
                      className={`revolver__cylinder ${stage === "spin" ? `is-spinning ${pullNumber === 1 ? "is-first-spin" : "is-indexing"}` : ""}`}
                      data-testid="revolver-cylinder"
                      style={cylinderStyle}
                    >
                      <circle cx="150" cy="78" r="27" fill="url(#steel)" stroke="#777b86" strokeWidth="1.3" />
                      <circle cx="150" cy="78" r="22" fill="none" stroke="#14151a" strokeWidth="1" strokeDasharray="3 3" />
                      {Array.from({ length: CHAMBERS }).map((_, slot) => {
                        const rad = ((slot * notch - 90) * Math.PI) / 180;
                        const cx = 150 + Math.cos(rad) * 16;
                        const cy = 78 + Math.sin(rad) * 16;
                        const hasBullet = slot === bulletSlot && !(fired && (stage === "impact" || stage === "result"));
                        const spentCase = slot === bulletSlot && fired && (stage === "impact" || stage === "result");
                        return (
                          <g key={slot} data-chamber={slot} data-cartridge={hasBullet ? "live" : spentCase ? "spent" : "empty"}>
                            <circle cx={cx} cy={cy} r="6.2" fill="#09090c" stroke={slot === bulletSlot ? "#d4a23f" : "#343640"} strokeWidth={slot === bulletSlot ? 1.5 : 1} />
                            {(hasBullet || spentCase) && <circle cx={cx} cy={cy} r="4.65" fill={spentCase ? "#775323" : "url(#brass)"} />}
                            {(hasBullet || spentCase) && <circle cx={cx} cy={cy} r="1.45" fill={spentCase ? "#21150c" : "#f7d67b"} stroke="#684116" strokeWidth="0.7" />}
                            <path d={`M${cx - 2.6} ${cy - 3.8} L${cx + 2.6} ${cy - 3.8}`} stroke="rgba(255,255,255,.2)" strokeWidth="0.7" />
                          </g>
                        );
                      })}
                      <circle cx="150" cy="78" r="4.2" fill="#9da1ac" stroke="#272830" strokeWidth="1.5" />
                      <path d="M148 51 L152 51" stroke="#f7d77d" strokeWidth="1.5" />
                    </g>
                    <path d="M146 44 L154 44 L150 51 Z" fill="#e1b85d" filter="drop-shadow(0 0 3px #ffd97b)" />
                  </g>

                  {stage === "load" && firstLoading && (
                    <motion.g data-testid="loading-cartridge" initial={{ x: 72, y: 58, rotate: 38, opacity: 0 }} animate={reduceMotion ? { x: 20, y: 13, rotate: 0, opacity: 1 } : { x: [72, 52, 29, 20], y: [58, 45, 20, 13], rotate: [38, 24, 8, 0], opacity: [0, 1, 1, 1] }} transition={{ duration: 0.56, ease: [0.2, 0.9, 0.25, 1] }}>
                      <rect x="142" y="50" width="16" height="29" rx="5" fill="url(#brass)" stroke="#5f3513" strokeWidth="1.3" />
                      <path d="M143 54 L157 54" stroke="#fff0a3" strokeWidth="1.4" opacity="0.75" />
                      <ellipse cx="150" cy="78" rx="8" ry="3.2" fill="#a96822" stroke="#4d2b11" strokeWidth="1" />
                    </motion.g>
                  )}

                  <motion.path
                    d="M198 60 L211 51 L215 64 L202 71 Z"
                    fill="url(#steel)" stroke="#09090c" strokeWidth="2"
                    style={{ transformBox: "view-box", transformOrigin: "202px 66px" }}
                    animate={{ rotate: stage === "load" ? 0 : stage === "cock" || stage === "spin" || stage === "aim" ? -31 : stage === "impact" ? 15 : 2 }}
                    transition={{ duration: stage === "cock" ? 0.46 : 0.13, ease: "easeOut" }}
                  />

                  <AnimatePresence>
                    {showFlash && (
                      <motion.g key="flash" data-testid="muzzle-flash" initial={{ opacity: 0, scale: 0.25 }} animate={{ opacity: [0, 1, 0.86, 0], scale: [0.25, 1.28, 0.94, 0.6], rotate: [0, -4, 3, 0] }} transition={{ duration: 0.44, ease: "easeOut" }} style={{ transformBox: "view-box", transformOrigin: "9px 82px" }}>
                        <path d="M10 82 L-42 53 L-22 78 L-49 83 L-22 88 L-42 111 Z" fill="#ffb329" />
                        <path d="M10 82 L-28 66 L-12 82 L-28 98 Z" fill="#fff8d6" />
                        <circle cx="7" cy="82" r="14" fill="#fff0ad" opacity="0.9" />
                      </motion.g>
                    )}
                  </AnimatePresence>
                </svg>

                {showFlash && <span className="revolver__shockwave" aria-hidden="true" />}
                {showFlash && <span className="revolver__barrel-glow" aria-hidden="true" />}
                {showFlash && SPARKS.map(([x, y], spark) => <i key={spark} className="revolver__spark" style={{ "--spark-x": `${x}px`, "--spark-y": `${y}px`, "--spark-delay": `${spark * 18}ms` } as CSSProperties} aria-hidden="true" />)}
                {showSmoke && <><span className="revolver__smoke revolver__smoke--one" aria-hidden="true" /><span className="revolver__smoke revolver__smoke--two" aria-hidden="true" /><span className="revolver__smoke revolver__smoke--three" aria-hidden="true" /></>}
                {showDryPulse && <><span className="revolver__dry-ring" aria-hidden="true" /><span className="revolver__dry-word" aria-hidden="true">ЩЁЛК</span></>}
              </motion.div>

              <AnimatePresence>
                {stage === "result" && (
                  <motion.p key={fired ? "bang" : "click"} className={`roulette__result ${fired ? "is-fired" : "is-safe"}`} initial={{ opacity: 0, scale: 0.58, letterSpacing: "0.2em" }} animate={{ opacity: 1, scale: 1, letterSpacing: "0.1em" }} transition={{ type: "spring", stiffness: 320, damping: 17 }}>
                    {fired ? "ВЫСТРЕЛ." : "ЩЁЛК. ПУСТО."}
                    <span>{fired ? "Боевой патрон был в активном гнезде." : "Под ударником было пустое гнездо."}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
