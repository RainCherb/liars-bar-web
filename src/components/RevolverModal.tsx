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
const AIM_MS = 700;
const COCK_MS = 700;
const SPIN_MS = 1300;
const IMPACT_MS = 500;

type RouletteStage = "aim" | "cock" | "spin" | "impact" | "result";

const STAGES: Array<{ id: RouletteStage; label: string }> = [
  { id: "aim", label: "Прицел" },
  { id: "cock", label: "Взвод" },
  { id: "spin", label: "Барабан" },
  { id: "impact", label: "Спуск" },
  { id: "result", label: "Исход" },
];

/**
 * Сцена русской рулетки: прицел → взвод курка → подача гнезда → щелчок или выстрел.
 * Визуальный оборот заканчивается ровно на следующем гнезде и не меняет
 * порядок патрона: каждая осечка по-прежнему приближает выстрел. Общая
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
    const impactTimer = setTimeout(() => {
      setScene({ id: sceneId, stage: "impact" });
      sfx.play(fired ? "gunshot" : "dryClick");
    }, AIM_MS + COCK_MS + SPIN_MS);
    const resultTimer = setTimeout(() => {
      setScene({ id: sceneId, stage: "result" });
    }, AIM_MS + COCK_MS + SPIN_MS + IMPACT_MS);

    return () => {
      clearTimeout(cockTimer);
      clearTimeout(spinTimer);
      clearTimeout(impactTimer);
      clearTimeout(resultTimer);
    };
  }, [open, sceneId, fired]);

  // Барабан провёрнут на число уже сделанных спусков.
  const spent = CHAMBERS - remainingChambers;
  const notch = 360 / CHAMBERS;
  const baseRotation = spent * notch;
  const nextRotation = baseRotation + notch;
  const stageIndex = STAGES.findIndex((item) => item.id === stage);
  const showFlash = fired && stage === "impact";
  const showSmoke = fired && (stage === "impact" || stage === "result");

  const fullGunMotion =
    stage === "aim"
      ? { x: 34, y: 26, rotate: -2, scale: 0.94, opacity: 1 }
      : stage === "cock"
        ? {
            x: [34, -18, -10],
            y: [26, -28, -20],
            rotate: [-2, -10, -7],
            scale: [0.94, 1.075, 1.04],
            opacity: 1,
          }
        : stage === "spin"
          ? {
              x: [-10, -18, -3, -14, -8],
              y: -20,
              rotate: [-7, -10, -5, -8, -7],
              scale: 1.04,
              opacity: 1,
            }
          : stage === "impact" && fired
            ? {
                x: [-8, 64, -34, 18, -10],
                y: [-20, -58, -4, -28, -18],
                rotate: [-7, -22, 4, -13, -7],
                scale: [1.04, 1.13, 0.96, 1.055, 1.02],
                opacity: 1,
              }
            : stage === "impact"
              ? {
                  x: [-8, 18, -13, 7, -6],
                  y: [-20, -25, -18],
                  rotate: [-7, -12, -4, -7],
                  scale: [1.04, 1.06, 1.01],
                  opacity: 1,
                }
              : { x: -6, y: -18, rotate: -7, scale: 1.02, opacity: 1 };

  const reducedGunMotion =
    stage === "aim"
      ? { x: 0, y: 0, rotate: 0, scale: 0.97, opacity: 0.72 }
      : stage === "cock"
        ? { x: 0, y: 0, rotate: 0, scale: 1.025, opacity: 1 }
        : stage === "spin"
          ? { x: 0, y: 0, rotate: 0, scale: 1, opacity: [0.72, 1] }
          : stage === "impact"
            ? {
                x: 0,
                y: 0,
                rotate: 0,
                scale: fired ? [1, 1.055, 1] : [1, 0.985, 1],
                opacity: fired ? [1, 0.48, 1] : 1,
              }
            : { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 };

  const gunMotion = reduceMotion ? reducedGunMotion : fullGunMotion;

  const gunTransition =
    reduceMotion
      ? { duration: stage === "impact" ? 0.3 : 0.38, ease: "easeOut" as const }
      : stage === "aim"
      ? { duration: 0.68, ease: [0.16, 1, 0.3, 1] as const }
      : stage === "cock"
        ? { duration: 0.62, ease: "easeOut" as const }
        : stage === "spin"
          ? { duration: 1.22, ease: "easeInOut" as const }
          : stage === "impact"
            ? { duration: fired ? 0.48 : 0.38, ease: "easeOut" as const }
            : { duration: 0.42, ease: "easeOut" as const };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={"overlay overlay--roulette " + (showFlash ? "is-bang" : "")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          data-stage={stage}
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
              У револьвера: <b>{shooterName}</b>
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

            <ol className="roulette__timeline" aria-label="Этапы спуска">
              {STAGES.map((item, itemIndex) => (
                <li
                  key={item.id}
                  className={
                    itemIndex === stageIndex
                      ? "is-active"
                      : itemIndex < stageIndex
                        ? "is-done"
                        : ""
                  }
                >
                  <span aria-hidden="true" />
                  {item.label}
                </li>
              ))}
            </ol>

            <div className="roulette__scene">
              <motion.div
                key={sceneId}
                className="revolver-wrap"
                initial={
                  reduceMotion
                    ? { scale: 0.96, opacity: 0 }
                    : { x: 260, y: 100, rotate: 22, scale: 0.62, opacity: 0 }
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
                          ? {
                              rotate:
                                stage === "spin" || stage === "impact" || stage === "result"
                                  ? nextRotation
                                  : baseRotation,
                            }
                          : stage === "spin"
                          ? {
                              rotate: [
                                baseRotation,
                                baseRotation + 70,
                                baseRotation + 238,
                                baseRotation + 388,
                                baseRotation + 360 + notch,
                              ],
                            }
                          : {
                              rotate:
                                stage === "impact" || stage === "result"
                                  ? nextRotation
                                  : baseRotation,
                            }
                      }
                      transition={
                        reduceMotion
                          ? { duration: stage === "spin" ? 0.38 : 0.12, ease: "easeOut" }
                          : stage === "spin"
                          ? {
                              duration: 1.2,
                              times: [0, 0.16, 0.48, 0.78, 1],
                              ease: [0.25, 0.8, 0.2, 1],
                            }
                          : { duration: 0.18, ease: "easeOut" }
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
                      <path d="M147 49 L153 49 L151 58 Z" fill="#d5af58" />
                      <circle cx="150" cy="52" r="1.8" fill="#fff0ae" />
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
                            : stage === "impact"
                              ? fired
                                ? 16
                                : 9
                              : 2,
                    }}
                    transition={{
                      duration: stage === "cock" ? 0.52 : 0.16,
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

                {showSmoke && <span className="revolver__smoke" aria-hidden="true" />}
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
                    : stage === "spin"
                      ? "Барабан проворачивается…"
                      : fired
                        ? "Отдача бьёт в плечо…"
                        : "Ударник срывается…"}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
