import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CHAMBERS } from "../game/types";
import { sfx } from "../game/sounds";
import {
  ROULETTE_STAGE_MS,
  type RouletteStage,
} from "../game/roulettePresentation";
import { cartridgeCountForPull } from "../game/revolverVisual";
import { RealisticRevolver } from "./RealisticRevolver";

interface Props {
  open: boolean;
  paused?: boolean;
  shooterName: string;
  fired: boolean;
  outcomePending?: boolean;
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
  outcomePending = false,
  pullNumber,
  remainingChambers,
  index,
  total,
  stageOverride,
}: Props) {
  const sceneId = `${shooterName}-${pullNumber}-${index}`;
  const firedRef = useRef(fired);
  firedRef.current = fired;
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
    schedule("impact");
    schedule("result");

    return () => timers.forEach(window.clearTimeout);
  }, [open, paused, sceneId, stageOverride]);

  useEffect(() => {
    if (stage === "impact" && !outcomePending) {
      sfx.play(firedRef.current ? "gunshot" : "dryClick");
    }
  }, [outcomePending, stage]);

  const spent = CHAMBERS - remainingChambers;
  const notch = 360 / CHAMBERS;
  const baseRotation = spent * notch;
  const finalRotation = baseRotation + notch;
  const activeSlot = mod(Math.round(-finalRotation / notch), CHAMBERS);
  const cartridgeCount = cartridgeCountForPull(pullNumber);
  const afterSpin = stage === "aim" || stage === "impact" || stage === "result";
  const showFlash = fired && stage === "impact";
  const showSmoke = fired && (stage === "impact" || stage === "result");
  const showBlood = fired && (stage === "impact" || stage === "result");
  const showDryPulse = !fired && stage === "impact";
  const cylinderStyle = {
    "--cylinder-from": `${baseRotation}deg`,
    "--cylinder-to": `${finalRotation}deg`,
    transform:
      stage === "load"
        ? `translate(-6px, 20px) rotate(${baseRotation - 16}deg)`
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
          data-outcome={outcomePending ? "pending" : fired ? "fired" : "dry"}
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
              Спуск №{pullNumber} · патронов в барабане — {cartridgeCount} из {CHAMBERS}
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
                <RealisticRevolver
                  stage={stage}
                  pullNumber={pullNumber}
                  activeSlot={activeSlot}
                  fired={fired}
                  showFlash={showFlash}
                  reduceMotion={Boolean(reduceMotion)}
                  cylinderStyle={cylinderStyle}
                />

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
