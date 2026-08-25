import { useState } from "react";
import { motion } from "framer-motion";
import type { CharacterId, Difficulty, GameVariant } from "../game/types";
import { DIFFICULTY_LABELS, VARIANT_LABELS } from "../game/types";
import { CHARACTERS } from "../game/characters";
import type { Settings, Stats } from "../game/storage";
import { Avatar } from "./Avatar";

interface Props {
  settings: Settings;
  stats: Stats;
  onChange: (s: Settings) => void;
  onStart: (s: Settings) => void;
  onShowRules: () => void;
  onResetStats: () => void;
}

const DIFFICULTY_HINTS: Record<Difficulty, string> = {
  easy: "Боты чаще ошибаются",
  normal: "Сбалансированная игра",
  hard: "Боты точнее считают заявки",
};

const VARIANT_HINTS: Record<GameVariant, string> = {
  classic: "Канон: 20 карт, 1–3 карты за ход",
  devil: "Вскрытый Дьявол ведёт к общему залпу",
};

export function MenuScreen({
  settings,
  stats,
  onChange,
  onStart,
  onShowRules,
  onResetStats,
}: Props) {
  const [showStats, setShowStats] = useState(false);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    onChange({ ...settings, [key]: value });

  const winRate =
    stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;

  return (
    <div className="menu">
      <div className="menu__glow" aria-hidden="true" />
      <motion.div
        className="menu__inner"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="menu__over">Добро пожаловать в самый нечестный бар города</p>
        <h1 className="menu__title">
          БАР <span>ЛЖЕЦОВ</span>
        </h1>
        <p className="menu__subtitle">
          Liar&apos;s Deck — блеф, револьвер и одна жизнь
        </p>

        <section className="menu__section">
          <h2 id="char-label">Выберите персонажа</h2>
          <div
            className="menu__chars"
            role="radiogroup"
            aria-labelledby="char-label"
          >
            {CHARACTERS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={settings.characterId === c.id}
                className={`menu__char ${settings.characterId === c.id ? "is-active" : ""}`}
                onClick={() => set("characterId", c.id as CharacterId)}
                title={c.title}
              >
                <Avatar characterId={c.id} size={64} />
                <span className="menu__char-name">{c.name}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="menu__row">
          <label className="menu__field">
            <span>Имя</span>
            <input
              value={settings.playerName}
              maxLength={16}
              onChange={(e) => set("playerName", e.target.value)}
            />
          </label>

          <div className="menu__field">
            <span id="diff-label">Сложность</span>
            <div className="menu__diff" role="radiogroup" aria-labelledby="diff-label">
              {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={settings.difficulty === d}
                  className={settings.difficulty === d ? "is-active" : ""}
                  onClick={() => set("difficulty", d)}
                >
                  {DIFFICULTY_LABELS[d]}
                  <small>{DIFFICULTY_HINTS[d]}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="menu__field">
            <span id="bots-label">Соперники</span>
            <div
              className="menu__diff menu__bots"
              role="radiogroup"
              aria-labelledby="bots-label"
            >
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={settings.botCount === n}
                  className={settings.botCount === n ? "is-active" : ""}
                  onClick={() => set("botCount", n)}
                >
                  {n}
                  <small>
                    {n === 1 ? "дуэль" : n === 2 ? "втроём" : "полный стол"}
                  </small>
                </button>
              ))}
            </div>
          </div>

          <div className="menu__field">
            <span id="variant-label">Режим</span>
            <div
              className="menu__diff menu__variant"
              role="radiogroup"
              aria-labelledby="variant-label"
            >
              {(Object.keys(VARIANT_LABELS) as GameVariant[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={settings.variant === v}
                  className={settings.variant === v ? "is-active" : ""}
                  onClick={() => set("variant", v)}
                >
                  {VARIANT_LABELS[v]}
                  <small>{VARIANT_HINTS[v]}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="menu__check">
          <input
            type="checkbox"
            checked={settings.timerEnabled}
            onChange={(e) => set("timerEnabled", e.target.checked)}
          />
          <span>Ограничение хода 30 секунд (как в оригинале)</span>
        </label>

        <div className="menu__actions">
          <button
            type="button"
            className="btn btn--primary btn--big"
            onClick={() => onStart(settings)}
          >
            Сесть за стол
          </button>
          <button type="button" className="btn" onClick={onShowRules}>
            Правила
          </button>
          <button
            type="button"
            className="btn"
            aria-expanded={showStats}
            onClick={() => setShowStats((v) => !v)}
          >
            Статистика
          </button>
        </div>

        {showStats && (
          <motion.section
            className="menu__stats"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <div className="menu__stats-grid">
              <Stat label="Партий" value={stats.games} />
              <Stat label="Побед" value={stats.wins} />
              <Stat label="Винрейт" value={`${winRate}%`} />
              <Stat label="Серия" value={stats.streak} />
              <Stat label="Лучшая серия" value={stats.bestStreak} />
              <Stat label="Блефов" value={stats.bluffsMade} />
              <Stat label="Попались" value={stats.bluffsCaught} />
              <Stat label="Верных вскрытий" value={stats.correctCalls} />
              <Stat label="Ошибочных" value={stats.falseCalls} />
              <Stat label="Осечек пережито" value={stats.pullsSurvived} />
            </div>
            {stats.games > 0 && (
              <button type="button" className="btn btn--ghost" onClick={onResetStats}>
                Сбросить статистику
              </button>
            )}
          </motion.section>
        )}

        <p className="menu__footnote">
          Колода: 6 Дам, 6 Королей, 6 Тузов и 2 Джокера. За ложь отвечают у револьвера.
        </p>
      </motion.div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="menu__stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
