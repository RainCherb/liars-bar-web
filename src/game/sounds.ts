import type { CharacterId, Rank } from "./types";

/**
 * Звуковые эффекты на WebAudio API и голосовые реплики персонажей.
 * Эффекты синтезируются на лету, а реплики лениво загружаются из public/audio.
 */

export type SfxName =
  | "card"
  | "flip"
  | "reload"
  | "spin"
  | "cock"
  | "dryClick"
  | "gunshot"
  | "heartbeat"
  | "win"
  | "lose"
  | "uiClick";

/**
 * Публичные голосовые события.
 *
 * `play` намеренно описывает только объявленную выкладку и никогда не зависит
 * от закрытых карт. Реплика `devilRevealed` допустима только после вскрытия.
 */
export type VoiceCue = "play" | "challenge" | "devilRevealed";

export interface VoiceOptions {
  count?: number;
  rank?: Rank;
}

type VoiceKey =
  | "liar"
  | "devil"
  | "threeCards"
  | "queen"
  | "queens"
  | "king"
  | "kings"
  | "ace"
  | "aces";

type VoiceProfile = Partial<Record<VoiceKey, string>>;

const VOICE_PROFILES: Partial<Record<CharacterId, VoiceProfile>> = {
  scubby: {
    devil: "audio/scubby/devil.wav",
    threeCards: "audio/scubby/three-cards.wav",
  },
  foxy: {
    devil: "audio/foxy/devil.wav",
    threeCards: "audio/foxy/three-cards.wav",
  },
  bristle: {
    devil: "audio/bristle/devil.wav",
    threeCards: "audio/bristle/three-cards.wav",
  },
  toar: {
    devil: "audio/toar/devil.wav",
    threeCards: "audio/toar/three-cards.wav",
  },
  cupcake: {
    liar: "audio/cupcake/liar.wav",
    devil: "audio/cupcake/devil.wav",
    threeCards: "audio/cupcake/three-cards.wav",
    queen: "audio/cupcake/queen.wav",
    queens: "audio/cupcake/queens.wav",
    king: "audio/cupcake/king.wav",
    kings: "audio/cupcake/kings.wav",
    ace: "audio/cupcake/ace.wav",
    aces: "audio/cupcake/aces.wav",
  },
  gerk: {
    liar: "audio/gerk/liar.wav",
    devil: "audio/gerk/devil.wav",
    threeCards: "audio/gerk/three-cards.wav",
    queen: "audio/gerk/queen.wav",
    queens: "audio/gerk/queens.wav",
    king: "audio/gerk/king.wav",
    kings: "audio/gerk/kings.wav",
    ace: "audio/gerk/ace.wav",
    aces: "audio/gerk/aces.wav",
  },
};

const GENERIC_VOICES = {
  liar: "audio/generic/liar.wav",
  devil: "audio/generic/devil.wav",
  counts: {
    1: "audio/generic/one.wav",
    2: "audio/generic/two.wav",
    3: "audio/generic/three.wav",
  },
} as const;

const RANK_VOICE_KEYS: Record<Rank, readonly [VoiceKey, VoiceKey]> = {
  Q: ["queen", "queens"],
  K: ["king", "kings"],
  A: ["ace", "aces"],
};

/**
 * Единая карта голосовых событий. Она намеренно не принимает реальные карты:
 * до вскрытия звук не должен выдавать, был ли ход честным или содержал Дьявола.
 */
export function resolveVoicePath(
  characterId: CharacterId | null,
  cue: VoiceCue,
  options: VoiceOptions = {},
): string {
  const profile = characterId ? VOICE_PROFILES[characterId] : undefined;

  if (cue === "challenge") {
    return profile?.liar ?? GENERIC_VOICES.liar;
  }
  if (cue === "devilRevealed") {
    return profile?.devil ?? GENERIC_VOICES.devil;
  }

  const count = Math.max(1, Math.min(3, Math.round(options.count ?? 1))) as
    | 1
    | 2
    | 3;
  if (count === 3 && profile?.threeCards) {
    return profile.threeCards;
  }
  if (options.rank && profile) {
    const [single, plural] = RANK_VOICE_KEYS[options.rank];
    const rankPath = profile[count === 1 ? single : plural];
    if (rankPath) return rankPath;
  }
  return GENERIC_VOICES.counts[count];
}

const MASTER_VOLUME = 0.5;

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voiceCache = new Map<string, HTMLAudioElement>();
  private activeVoice: HTMLAudioElement | null = null;
  muted = false;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : MASTER_VOLUME;
    if (muted && this.activeVoice) {
      this.activeVoice.pause();
      this.activeVoice.currentTime = 0;
      this.activeVoice = null;
    }
  }

  private voice(path: string): HTMLAudioElement | null {
    if (typeof Audio === "undefined") return null;
    const cached = this.voiceCache.get(path);
    if (cached) return cached;

    const url =
      typeof document === "undefined" ? path : new URL(path, document.baseURI).href;
    const audio = new Audio(url);
    audio.preload = "auto";
    audio.volume = 0.82;
    this.voiceCache.set(path, audio);
    return audio;
  }

  private playVoiceFile(path: string): void {
    const audio = this.voice(path);
    if (!audio) return;

    if (this.activeVoice && this.activeVoice !== audio) {
      this.activeVoice.pause();
      this.activeVoice.currentTime = 0;
    }

    audio.currentTime = 0;
    this.activeVoice = audio;
    audio.onended = () => {
      if (this.activeVoice === audio) this.activeVoice = null;
    };
    void audio.play().catch(() => {
      if (this.activeVoice === audio) this.activeVoice = null;
    });
  }

  /** Озвучивает только публичное событие: заявление, обвинение или уже вскрытого Дьявола. */
  playVoice(
    characterId: CharacterId | null,
    cue: VoiceCue,
    options: VoiceOptions = {},
  ): void {
    if (this.muted) return;

    const path = resolveVoicePath(characterId, cue, options);
    if (path) this.playVoiceFile(path);
  }

  /**
   * Тактильная отдача на мобильных устройствах. На десктопе и при SSR
   * безопасно ничего не делает, если Vibration API недоступен.
   */
  private vibrate(pattern: number | number[]): void {
    if (this.muted) return;
    if (typeof navigator === "undefined") return;
    const nav = navigator as Navigator & {
      vibrate?: (pattern: number | number[]) => boolean;
    };
    if (typeof nav.vibrate !== "function") return;
    try {
      nav.vibrate(pattern);
    } catch {
      /* Некоторые браузеры блокируют вибрацию без жеста пользователя. */
    }
  }

  private noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  play(name: SfxName): void {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;

    // Тактильная отдача для ключевых событий, если доступен Vibration API.
    switch (name) {
      case "reload":
        this.vibrate([10, 24, 12]);
        break;
      case "gunshot":
        this.vibrate([40, 30, 120]);
        break;
      case "dryClick":
        this.vibrate(18);
        break;
      case "win":
        this.vibrate([25, 40, 25, 40, 60]);
        break;
      case "lose":
        this.vibrate(180);
        break;
    }

    switch (name) {
      case "card":
      case "uiClick": {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer(ctx, 0.08);
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = name === "card" ? 1800 : 3000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(name === "card" ? 0.35 : 0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        src.connect(filter).connect(g).connect(this.master);
        src.start(t);
        break;
      }
      case "flip": {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer(ctx, 0.16);
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1200, t);
        filter.frequency.exponentialRampToValueAtTime(3500, t + 0.14);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        src.connect(filter).connect(g).connect(this.master);
        src.start(t);
        break;
      }
      case "reload": {
        // Латунный патрон входит в гнездо, затем барабан защёлкивается.
        for (const [offset, freq, gain] of [
          [0, 2600, 0.2],
          [0.18, 1350, 0.3],
          [0.39, 720, 0.38],
        ] as const) {
          const src = ctx.createBufferSource();
          src.buffer = this.noiseBuffer(ctx, 0.045);
          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.value = freq;
          filter.Q.value = 7;
          const g = ctx.createGain();
          g.gain.setValueAtTime(gain, t + offset);
          g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.055);
          src.connect(filter).connect(g).connect(this.master);
          src.start(t + offset);
        }
        break;
      }
      case "spin": {
        // Трещотка укладывается в визуальную фазу вращения (~1 секунда).
        let time = t;
        for (let i = 0; i < 11; i++) {
          const src = ctx.createBufferSource();
          src.buffer = this.noiseBuffer(ctx, 0.03);
          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.value = 2200 + Math.random() * 800;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.28 - i * 0.012, time);
          g.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
          src.connect(filter).connect(g).connect(this.master);
          src.start(time);
          time += 0.035 + i * 0.009;
        }
        break;
      }
      case "cock": {
        // Взведение курка: два металлических щелчка (храповик + фиксатор).
        for (const [offset, freq] of [
          [0, 1400],
          [0.16, 2100],
        ] as const) {
          const src = ctx.createBufferSource();
          src.buffer = this.noiseBuffer(ctx, 0.05);
          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.value = freq;
          filter.Q.value = 6;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.32, t + offset);
          g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.05);
          src.connect(filter).connect(g).connect(this.master);
          src.start(t + offset);
        }
        break;
      }
      case "dryClick": {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.06);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(g).connect(this.master);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
      }
      case "gunshot": {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer(ctx, 0.5);
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(6000, t);
        filter.frequency.exponentialRampToValueAtTime(220, t + 0.4);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.9, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        src.connect(filter).connect(g).connect(this.master);
        src.start(t);

        // Низкий удар.
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(38, t + 0.3);
        const og = ctx.createGain();
        og.gain.setValueAtTime(0.8, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(og).connect(this.master);
        osc.start(t);
        osc.stop(t + 0.4);
        break;
      }
      case "heartbeat": {
        for (const [offset, freq] of [
          [0, 70],
          [0.18, 55],
        ] as const) {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = freq;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t + offset);
          g.gain.exponentialRampToValueAtTime(0.5, t + offset + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.16);
          osc.connect(g).connect(this.master);
          osc.start(t + offset);
          osc.stop(t + offset + 0.2);
        }
        break;
      }
      case "win":
      case "lose": {
        const notes = name === "win" ? [392, 494, 587, 784] : [330, 262, 196];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = name === "win" ? "triangle" : "sawtooth";
          osc.frequency.value = freq;
          const start = t + i * 0.14;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, start);
          g.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
          osc.connect(g).connect(this.master!);
          osc.start(start);
          osc.stop(start + 0.45);
        });
        break;
      }
    }
  }

  /** Разблокировать AudioContext после первого жеста пользователя. */
  unlock(): void {
    this.ensure();
  }
}

export const sfx = new SoundEngine();
