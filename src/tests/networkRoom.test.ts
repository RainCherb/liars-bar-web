import { describe, expect, it } from "vitest";
import { Room } from "../../server/room";

describe("безопасность сетевой комнаты", () => {
  it("не восстанавливает чужое место только по публичному playerId", () => {
    const room = new Room("ABC234");
    const host = room.identify("Хозяин", "foxy", undefined, undefined, true);
    const attacker = room.identify(
      "Самозванец",
      "gerk",
      host.playerId,
      undefined,
      false,
    );

    expect(attacker.playerId).not.toBe(host.playerId);
    expect(attacker.isHost).toBe(false);
    expect(room.players.get(host.playerId)?.name).toBe("Хозяин");
  });

  it("не начинает матч с отключённым вторым игроком", () => {
    const room = new Room("ABC234");
    const host = room.identify("Хозяин", "foxy", undefined, undefined, true);
    const guest = room.identify("Гость", "cupcake", undefined, undefined, false);
    room.setConnected(guest.playerId, false);

    expect(() => room.start(host.playerId)).toThrow(/подключённых/);
  });
});
