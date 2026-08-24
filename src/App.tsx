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
        <Game
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

function Game({ setup, muted, onToggleMute, onExit, onRestart, onGameEnd }: GameProps) {
  // Пауза: боты не ходят, рулетка не доигрывается, таймер стоит.
  const [paused, setPaused] = useState(false);
  const api = useGameLoop(setup, paused);
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
      paused={paused}
      onPause={setPaused}
    />
  );
}
