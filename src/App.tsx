import { useCallback, useEffect, useRef, useState } from "react";
import type { GameState } from "./game/types";
import { useGameLoop, type GameSetup } from "./hooks/useGameLoop";
import { sfx } from "./game/sounds";
import {
  applyOutcome,
  loadSettings,
  loadStats,
  resetStats as clearStats,
  saveSettings,
  saveStats,
  type Settings,
  type Stats,
} from "./game/storage";
import { MenuScreen } from "./components/MenuScreen";
import { GameTable } from "./components/GameTable";
import { RulesModal } from "./components/RulesModal";
import { OrientationGate } from "./components/OrientationGate";
import { RevolverModal } from "./components/RevolverModal";
import { AnimatePresence } from "framer-motion";

type Screen = "menu" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [showRules, setShowRules] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [stats, setStats] = useState<Stats>(() => loadStats());
  const [gameKey, setGameKey] = useState(0);

  // Настройки переживают перезагрузку.
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    sfx.setMuted(settings.muted);
  }, [settings.muted]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [screen, gameKey]);

  const setup: GameSetup = {
    playerName: settings.playerName,
    characterId: settings.characterId,
    difficulty: settings.difficulty,
    botCount: settings.botCount,
    variant: settings.variant,
    timerEnabled: settings.timerEnabled,
  };

  const start = (next: Settings) => {
    sfx.unlock();
    sfx.play("uiClick");
    setSettings(next);
    setGameKey((k) => k + 1);
    setScreen("game");
  };

  const restart = () => {
    sfx.play("uiClick");
    setGameKey((k) => k + 1);
  };

  const recordOutcome = useCallback((state: GameState) => {
    if (state.phase.kind !== "gameover") return;
    const me = state.players[0];
    const next = applyOutcome(loadStats(), {
      won: state.phase.winner === 0,
      bluffsMade: me.bluffsMade,
      bluffsCaught: me.bluffsCaught,
      correctCalls: me.correctCalls,
      falseCalls: me.falseCalls,
      pullsSurvived: me.pullsSurvived,
    });
    saveStats(next);
    setStats(next);
  }, []);

  const toggleMute = () => {
    sfx.unlock();
    const muted = !settings.muted;
    setSettings((s) => ({ ...s, muted }));
    if (!muted) sfx.play("uiClick");
  };

  // Детерминированная сцена доступна только на локальном сервере визуальной QA.
  const isLocalQa =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";
  const qaRoulette = isLocalQa
    ? new URLSearchParams(window.location.search).get("qa")
    : null;
  const qaStageParam = isLocalQa
    ? new URLSearchParams(window.location.search).get("stage")
    : null;
  const qaStage =
    qaStageParam === "load" ||
    qaStageParam === "cock" ||
    qaStageParam === "spin" ||
    qaStageParam === "aim" ||
    qaStageParam === "impact" ||
    qaStageParam === "result"
      ? qaStageParam
      : undefined;
  if (qaRoulette === "roulette-fired" || qaRoulette === "roulette-dry") {
    return (
      <div className="app app--visual-qa">
        <RevolverModal
          open
          shooterName="Проверка механики"
          fired={qaRoulette === "roulette-fired"}
          pullNumber={1}
          remainingChambers={6}
          index={1}
          total={1}
          stageOverride={qaStage}
        />
      </div>
    );
  }

  return (
    <div className="app">
      {/* Плавающая кнопка звука — только в меню; в игре звук в топбаре */}
      {screen === "menu" && (
        <button
          type="button"
          className="sound-toggle"
          aria-pressed={settings.muted}
          title={settings.muted ? "Включить звук" : "Выключить звук"}
          onClick={toggleMute}
        >
          <span aria-hidden="true">{settings.muted ? "🔇" : "🔊"}</span>
          <span className="sr-only">
            {settings.muted ? "Включить звук" : "Выключить звук"}
          </span>
        </button>
      )}

      {screen === "menu" ? (
        <MenuScreen
          settings={settings}
          stats={stats}
          onChange={setSettings}
          onStart={start}
          onShowRules={() => setShowRules(true)}
          onResetStats={() => setStats(clearStats())}
        />
      ) : (
        <LandscapeGame
          key={gameKey}
          setup={setup}
          muted={settings.muted}
          onToggleMute={toggleMute}
          onExit={() => setScreen("menu")}
          onRestart={restart}
          onGameEnd={recordOutcome}
        />
      )}

      {showRules && (
        <RulesModal
          variant={settings.variant}
          onClose={() => setShowRules(false)}
        />
      )}
    </div>
  );
}

interface GameProps {
  setup: GameSetup;
  muted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
  onRestart: () => void;
  onGameEnd: (state: GameState) => void;
}

function readPortraitPhone(): boolean {
  if (typeof window === "undefined") return false;
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  const longSide = Math.max(window.innerWidth, window.innerHeight);
  // Размеры намеренно важнее user-agent: так работают iPadOS «как Mac»,
  // встроенные браузеры и режим «сайт для компьютера» на телефоне.
  return (
    window.innerHeight > window.innerWidth &&
    shortSide <= 600 &&
    longSide <= 1100
  );
}

function usePortraitPhone(): boolean {
  const [portrait, setPortrait] = useState(readPortraitPhone);

  useEffect(() => {
    const update = () => setPortrait(readPortraitPhone());
    const media = window.matchMedia("(orientation: portrait)");
    media.addEventListener?.("change", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    update();
    return () => {
      media.removeEventListener?.("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return portrait;
}

function LandscapeGame(props: GameProps) {
  const portrait = usePortraitPhone();
  const [started, setStarted] = useState(() => !portrait);

  useEffect(() => {
    if (!portrait) setStarted(true);
  }, [portrait]);

  if (!started) return <OrientationGate />;

  return (
    <>
      <Game {...props} orientationBlocked={portrait} />
      <AnimatePresence>{portrait && <OrientationGate resumed />}</AnimatePresence>
    </>
  );
}

function Game({
  setup,
  muted,
  onToggleMute,
  onExit,
  onRestart,
  onGameEnd,
  orientationBlocked = false,
}: GameProps & { orientationBlocked?: boolean }) {
  // Пауза: боты не ходят, рулетка не доигрывается, таймер стоит.
  const [paused, setPaused] = useState(false);
  const effectivePaused = paused || orientationBlocked;
  const api = useGameLoop(setup, effectivePaused);
  const recorded = useRef(false);

  useEffect(() => {
    if (api.state.phase.kind === "gameover" && !recorded.current) {
      recorded.current = true;
      onGameEnd(api.state);
    }
  }, [api.state, onGameEnd]);

  return (
    <GameTable
      api={api}
      setup={setup}
      muted={muted}
      onToggleMute={onToggleMute}
      onExit={onExit}
      onRestart={onRestart}
      paused={effectivePaused}
      onPause={setPaused}
    />
  );
}
