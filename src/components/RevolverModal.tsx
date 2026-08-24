import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CHAMBERS } from "../game/types";
import { sfx } from "../game/sounds";

interface Props {
  open: boolean;
  shooterName: string;
  fired: boolean;
  /** Номер спуска для стрелка (1..6). */
  pullNumber: number;
  /** Гнёзд оставалось до спуска (6..1): шанс выстрела 1 из N. */
  remainingChambers: number;
  /** Порядок в серии выстрелов (вариант «Дьявол»). */
  index: number;
  total: number;
}

/** Тайминги сцены. Согласованы с ROULETTE_MS в useGameLoop (запас на закрытие). */
const AIM_MS = 650;
const COCK_MS = 650;
const SPIN_MS = 1150;

type RouletteStage = "aim" | "cock" | "spin" | "result";

/**
 * Сцена русской рулетки: прицел → взвод курка → подача гнезда → щелчок или выстрел.
 * Барабан НЕ раскручивается заново: по правилам его крутят лишь однажды в
 * начале партии, поэтому каждая осечка приближает боевой патрон. Общая
 * длительность согласована с таймером ADVANCE (ROULETTE_MS).
 */
export function RevolverModal({
  open,
  shooterName,
  fired,
  pullNumber,
  remainingChambers,
  index,
  total,
}: Props) {
  const sceneId = `${shooterName}-${pullNumber}-${index}`;
  const [scene, setScene] = useState<{ id: string; stage: RouletteStage }>({
    id: "",
    stage: "aim",
  });
  const reduceMotion = useReducedMotion();
  // При серии выстрелов новые props приходят до срабатывания эффекта. Не показываем
  // результат предыдущего стрелка даже на один кадр.
  const stage: RouletteStage = scene.id === sceneId ? scene.stage : "aim";

  useEffect(() => {
    if (!open) {
      setScene({ id: "", stage: "aim" });
      return;
    }
    setScene({ id: sceneId, stage: "aim" });

    const cockTimer = setTimeout(() => {
      setScene({ id: sceneId, stage: "cock" });
      sfx.play("cock");
    }, AIM_MS);
    const spinTimer = setTimeout(() => {
      setScene({ id: sceneId, stage: "spin" });
      sfx.play("spin");
    }, AIM_MS + COCK_MS);
    const resultTimer = setTimeout(() => {
      setScene({ id: sceneId, stage: "result" });
      sfx.play(fired ? "gunshot" : "dryClick");
    }, AIM_MS + COCK_MS + SPIN_MS);

    return () => {
      clearTimeout(cockTimer);
      clearTimeout(spinTimer);
      clearTimeout(resultTimer);
    };
  }, [open, sceneId, fired]);

  // Барабан провёрнут на число уже сделанных спусков.
  const spent = CHAMBERS - remainingChambers;
  const notch = 360 / CHAMBERS;
  const baseRotation = spent * notch;
  const nextRotation = baseRotation + notch;
  const showFlash = fired && stage === "result";

  const gunMotion = reduceMotion
    ? { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }
    : stage === "aim"
      ? { x: 0, y: 0, rotate: -5, scale: 1, opacity: 1 }
      : stage === "cock"
        ? {
            x: [0, -6, 0],
            y: [0, -11, -8],
            rotate: [-5, -8, -6],
            scale: [1, 1.025, 1.015],
            opacity: 1,
          }
        : stage === "spin"
          ? {
              x: [0, -4, 3, -2, 0],
              y: -8,
              rotate: [-6, -7, -5, -6],
              scale: 1.015,
              opacity: 1,
            }
          : fired
            ? {
                x: [0, 30, -18, 10, -5, 0],
                y: [-8, -26, -5, -12, -8],
                rotate: [-6, -15, -2, -9, -6],
                scale: [1.015, 1.06, 0.985, 1.02, 1],
                opacity: 1,
              }
            : {
                x: [0, 7, -4, 2, 0],
                y: [-8, -11, -8],
                rotate: [-6, -8, -5, -6],
                scale: 1,
                opacity: 1,
              };

  const gunTransition = reduceMotion
    ? { duration: 0 }
    : stage === "aim"
      ? { duration: 0.62, ease: [0.16, 1, 0.3, 1] as const }
      : stage === "cock"
        ? { duration: 0.48, ease: "easeOut" as const }
        : stage === "spin"
          ? { duration: 1.05, ease: "easeInOut" as const }
          : { duration: fired ? 0.58 : 0.34, ease: "easeOut" as const };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={"overlay overlay--roulette " + (showFlash ? "is-bang" : "")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="alertdialog"
          aria-label="Русская рулетка"
        >
          <motion.div
            className="roulette"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
          >
            <p className="roulette__title">
              Русская рулетка
              {total > 1 && (
                <span className="roulette__series">
                  {" "}
                  · спуск {index} из {total}
                </span>
              )}
            </p>
            <p className="roulette__who">
              Спускает курок: <b>{shooterName}</b>
            </p>
            <motion.p
              key={pullNumber + "-" + index}
              className={"roulette__bullets " + (remainingChambers <= 3 ? "is-hot" : "")}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              Спуск №{pullNumber} ·{" "}
              {remainingChambers > 1
                ? `риск выстрела — 1 из ${remainingChambers}`
                : "выстрел неизбежен"}
            </motion.p>

            <div className="roulette__scene">
              <motion.div
                key={sceneId}
                className="revolver-wrap"
                initial={
                  reduceMotion
                    ? false
                    : { x: 120, y: 74, rotate: 13, scale: 0.78, opacity: 0 }
                }
                animate={gunMotion}
                transition={gunTransition}
              >
                <svg viewBox="0 0 280 170" className="revolver" aria-hidden="true">
                  {/* Ствол */}
                  <rect x="14" y="70" width="128" height="24" rx="6" fill="#2a2a30" stroke="#111" strokeWidth="3" />
                  <rect x="18" y="75" width="118" height="6" rx="3" fill="#4a4a55" />
                  <rect x="10" y="68" width="12" height="28" rx="3" fill="#1c1c22" stroke="#111" strokeWidth="2" />
                  {/* Рамка и рукоять */}
                  <path
                    d="M132 62 L196 62 L214 120 Q220 150 190 156 L150 160 L150 108 Z"
                    fill="#23232a"
                    stroke="#111"
                    strokeWidth="3"
                  />
                  <path d="M150 96 L182 96 L176 116 L150 118 Z" fill="#3a2a1c" stroke="#111" strokeWidth="2" />
                  {/* Скоба и спусковой крючок */}
                  <path d="M150 100 Q150 128 168 128 L184 128" fill="none" stroke="#111" strokeWidth="3" />
                  <path d="M158 104 L158 118 Q158 124 164 124" fill="none" stroke="#5a5a66" strokeWidth="3" />

                  {/* Барабан: цельная деталь, проворачивается на одно гнездо */}
                  <g style={{ transformBox: "view-box", transformOrigin: "150px 78px" }}>
                    <circle cx="150" cy="78" r="30" fill="#33333d" stroke="#111" strokeWidth="3" />
                    <motion.g
                      className="revolver__cylinder"
                      style={{ transformBox: "view-box", transformOrigin: "150px 78px" }}
                      animate={
                        reduceMotion
                          ? { rotate: stage === "result" ? nextRotation : baseRotation }
                          : stage === "spin"
                            ? {
                                rotate: [
                                  baseRotation,
                                  baseRotation + notch * 0.18,
                                  baseRotation + notch * 0.92,
                                  baseRotation + notch * 0.8,
                                  nextRotation,
                                ],
                              }
                            : { rotate: stage === "result" ? nextRotation : baseRotation }
                      }
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : stage === "spin"
                            ? { duration: 0.95, times: [0, 0.18, 0.68, 0.84, 1], ease: "easeInOut" }
                            : { duration: 0.16, ease: "easeOut" }
                      }
                    >
                      <circle cx="150" cy="78" r="26" fill="#454550" stroke="#15151a" strokeWidth="2" />
                      {Array.from({ length: CHAMBERS }).map((_, i) => {
                        const rad = ((i * notch - 90) * Math.PI) / 180;
                        const cx = 150 + Math.cos(rad) * 16;
                        const cy = 78 + Math.sin(rad) * 16;
                        const used = i < spent;
                        return (
                          <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r="5.4"
                            fill={used ? "#0d0b0e" : "#17171c"}
                            stroke={used ? "#6a4a2f" : "#2a2a33"}
                            strokeWidth={used ? 1.6 : 1}
                          />
                        );
                      })}
                      <circle cx="150" cy="78" r="4" fill="#8f97a3" />
                    </motion.g>
                  </g>

                  {/* Курок */}
                  <motion.path
                    d="M198 60 L210 52 L214 64 L202 70 Z"
                    fill="#2a2a30"
                    stroke="#111"
                    strokeWidth="2"
                    style={{ transformBox: "view-box", transformOrigin: "202px 66px" }}
                    animate={{
                      rotate:
                        stage === "aim"
                          ? 0
                          : stage === "cock" || stage === "spin"
                            ? -30
                            : fired
                              ? 8
                              : 0,
                    }}
                    transition={{
                      duration: reduceMotion ? 0 : stage === "cock" ? 0.38 : 0.14,
                      ease: "easeOut",
                    }}
                  />

                  {/* Дульная вспышка */}
                  <AnimatePresence>
                    {showFlash && (
                      <motion.g
                        key="flash"
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: [0, 1, 0.7, 0], scale: [0.4, 1.15, 1, 0.7] }}
                        transition={{ duration: 0.42, ease: "easeOut" }}
                        style={{ transformBox: "view-box", transformOrigin: "10px 82px" }}
                      >
                        <path d="M10 82 L-30 60 L-14 82 L-30 104 Z" fill="#ffd27a" />
                        <path d="M10 82 L-14 70 L-4 82 L-14 94 Z" fill="#fff3c4" />
                        <circle cx="8" cy="82" r="12" fill="#ffb347" opacity="0.8" />
                      </motion.g>
                    )}
                  </AnimatePresence>
                </svg>

                {showFlash && <span className="revolver__smoke" aria-hidden="true" />}
              </motion.div>

              <AnimatePresence>
                {stage === "result" && (
                  <motion.p
                    key={fired ? "bang" : "click"}
                    className={"roulette__result " + (fired ? "is-fired" : "is-safe")}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 16 }}
                  >
                    {fired ? "ВЫСТРЕЛ." : "ЩЁЛК. Пусто."}
                    {!fired && <span>Барабан помнит каждую осечку.</span>}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {stage !== "result" && (
              <p className="roulette__hint">
                {stage === "aim"
                  ? "Ствол поднимается…"
                  : stage === "cock"
                    ? "Курок взводится…"
                    : "Барабан подаёт следующее гнездо…"}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
