import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { PlayerState } from "../game/types";
import { CHAMBERS } from "../game/types";

interface Props {
  winnerName: string | null;
  humanWon: boolean;
  players: PlayerState[];
  playerName: string;
  rounds: number;
  onRestart: () => void;
  onExit: () => void;
}

export function ResultScreen({
  winnerName,
  humanWon,
  players,
  playerName,
  rounds,
  onRestart,
  onExit,
}: Props) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);

  return (
    <motion.div
      className={`overlay overlay--result ${humanWon ? "is-win" : "is-lose"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      aria-label="Итог партии"
    >
      <motion.div
        className="result"
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
      >
        <h2 className="result__title">
          {humanWon ? "ВЫ ВЫЖИЛИ" : winnerName === null ? "ВСЕ МЁРТВЫ" : "КОНЕЦ НОЧИ"}
        </h2>
        <p className="result__sub">
          {humanWon
            ? `Последний живой за столом — ${winnerName}. Бар аплодирует.`
            : winnerName === null
              ? "За столом не осталось живых. Бармен гасит свет."
              : `Победа уходит к ${winnerName}. Ваше место пустует до утра.`}
          {" "}Раундов сыграно: {rounds}.
        </p>

        <div className="result__tablewrap">
          <table className="result__stats">
            <thead>
              <tr>
                <th scope="col">Игрок</th>
                <th scope="col">Статус</th>
                <th scope="col">Блефов</th>
                <th scope="col">Пойман</th>
                <th scope="col">Верных вскрытий</th>
                <th scope="col">Ошибочных</th>
                <th scope="col">Осечек</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <motion.tr
                  key={p.seat}
                  className={p.isHuman ? "is-me" : ""}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.09, duration: 0.35 }}
                >
                  <td>{p.name}</td>
                  <td>
                    {p.alive
                      ? `жив · гнёзд ${Math.max(1, p.chambers.length)} из ${CHAMBERS}`
                      : "мёртв"}
                  </td>
                  <td>{p.bluffsMade}</td>
                  <td>{p.bluffsCaught}</td>
                  <td>{p.correctCalls}</td>
                  <td>{p.falseCalls}</td>
                  <td>{p.pullsSurvived}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="result__actions">
          <button
            ref={first}
            type="button"
            className="btn btn--primary btn--big"
            onClick={onRestart}
          >
            Сыграть ещё раз, {playerName}
          </button>
          <button type="button" className="btn" onClick={onExit}>
            В меню
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
