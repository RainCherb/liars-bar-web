import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SoundEngine, resolveVoicePath } from "../game/sounds";

class FakeAudio {
  static created: FakeAudio[] = [];

  src: string;
  preload = "";
  volume = 1;
  currentTime = 0;
  onended: (() => void) | null = null;
  pause = vi.fn();
  play = vi.fn(() => Promise.resolve());

  constructor(src = "") {
    this.src = src;
    FakeAudio.created.push(this);
  }
}

const NativeAudio = globalThis.Audio;

describe("голосовые реплики", () => {
  let engine: SoundEngine;

  beforeAll(() => {
    globalThis.Audio = FakeAudio as unknown as typeof Audio;
  });

  afterAll(() => {
    globalThis.Audio = NativeAudio;
  });

  beforeEach(() => {
    FakeAudio.created = [];
    engine = new SoundEngine();
  });

  it("выбирает персональную реплику для публичного события", () => {
    engine.playVoice("cupcake", "challenge");

    expect(FakeAudio.created).toHaveLength(1);
    expect(FakeAudio.created[0].src).toContain("audio/cupcake/liar.wav");
    expect(FakeAudio.created[0].preload).toBe("auto");
    expect(FakeAudio.created[0].play).toHaveBeenCalledOnce();
  });

  it("озвучивает Дьявола только через отдельное событие вскрытия", () => {
    expect(resolveVoicePath("scubby", "play", { count: 1, rank: "Q" })).toBe(
      "audio/generic/one.wav",
    );
    expect(resolveVoicePath("scubby", "devilRevealed")).toBe(
      "audio/scubby/devil.wav",
    );
  });

  it("подбирает форму номинала по числу заявленных карт", () => {
    expect(resolveVoicePath("cupcake", "play", { count: 1, rank: "K" })).toBe(
      "audio/cupcake/king.wav",
    );
    expect(resolveVoicePath("cupcake", "play", { count: 2, rank: "K" })).toBe(
      "audio/cupcake/kings.wav",
    );
    expect(resolveVoicePath("cupcake", "play", { count: 3, rank: "K" })).toBe(
      "audio/cupcake/three-cards.wav",
    );
  });

  it("ограничивает число карт игровым диапазоном 1–3", () => {
    expect(resolveVoicePath(null, "play", { count: -10 })).toBe(
      "audio/generic/one.wav",
    );
    expect(resolveVoicePath(null, "play", { count: 99 })).toBe(
      "audio/generic/three.wav",
    );
  });

  it("использует резервную реплику для персонажа без полного набора", () => {
    engine.playVoice("kudo", "play", { count: 2, rank: "K" });

    expect(FakeAudio.created).toHaveLength(1);
    expect(FakeAudio.created[0].src).toContain("audio/generic/two.wav");
    expect(FakeAudio.created[0].play).toHaveBeenCalledOnce();
  });

  it("кэширует аудиофайл и перезапускает его с начала", () => {
    engine.playVoice("cupcake", "challenge");
    const cached = FakeAudio.created[0];
    cached.currentTime = 1.5;

    engine.playVoice("cupcake", "challenge");

    expect(FakeAudio.created).toHaveLength(1);
    expect(cached.currentTime).toBe(0);
    expect(cached.play).toHaveBeenCalledTimes(2);
  });

  it("останавливает предыдущую реплику при запуске другой", () => {
    engine.playVoice("cupcake", "challenge");
    const previous = FakeAudio.created[0];
    previous.currentTime = 0.8;

    engine.playVoice("cupcake", "devilRevealed");

    expect(previous.pause).toHaveBeenCalledOnce();
    expect(previous.currentTime).toBe(0);
    expect(FakeAudio.created).toHaveLength(2);
    expect(FakeAudio.created[1].play).toHaveBeenCalledOnce();
  });

  it("останавливает голос и блокирует новые реплики без звука", () => {
    engine.playVoice("scubby", "devilRevealed");
    const active = FakeAudio.created[0];

    engine.setMuted(true);
    engine.playVoice("foxy", "devilRevealed");

    expect(active.pause).toHaveBeenCalledOnce();
    expect(active.currentTime).toBe(0);
    expect(FakeAudio.created).toHaveLength(1);
  });

  it("после включения звука переиспользует кэшированную реплику", () => {
    engine.playVoice("scubby", "challenge");
    const cached = FakeAudio.created[0];
    engine.setMuted(true);
    engine.setMuted(false);

    engine.playVoice("scubby", "challenge");

    expect(FakeAudio.created).toHaveLength(1);
    expect(cached.play).toHaveBeenCalledTimes(2);
  });

  it("сбрасывает активную реплику после завершения и ошибки воспроизведения", async () => {
    engine.playVoice("cupcake", "challenge");
    const completed = FakeAudio.created[0];
    completed.onended?.();

    engine.playVoice("cupcake", "devilRevealed");
    const rejected = FakeAudio.created[1];
    rejected.play.mockRejectedValueOnce(new Error("autoplay blocked"));
    engine.playVoice("cupcake", "devilRevealed");
    await Promise.resolve();

    engine.setMuted(true);
    expect(rejected.pause).not.toHaveBeenCalled();
  });
});
