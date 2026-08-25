import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import WebSocket from "ws";

const port = 8099;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["server-dist/server/index.js"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

class Inbox {
  constructor(socket) {
    this.messages = [];
    this.waiters = [];
    socket.on("message", (data) => {
      const message = JSON.parse(String(data));
      this.messages.push(message);
      for (const wake of this.waiters.splice(0)) wake();
    });
  }

  async next(predicate, timeoutMs = 5000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const index = this.messages.findIndex(predicate);
      if (index >= 0) return this.messages.splice(index, 1)[0];
      await Promise.race([
        new Promise((resolve) => this.waiters.push(resolve)),
        delay(Math.min(100, Math.max(1, deadline - Date.now()))),
      ]);
    }
    throw new Error("Timed out waiting for network event");
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {
      // Процесс ещё запускается.
    }
    await delay(100);
  }
  throw new Error("Server did not become healthy");
}

function openPlayer(roomCode, playerName, characterId, wantsHost) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const inbox = new Inbox(socket);
    socket.once("open", () => {
      socket.send(JSON.stringify({
        type: "identify",
        roomCode,
        playerName,
        characterId,
        wantsHost,
      }));
      resolve({ socket, inbox });
    });
    socket.once("error", reject);
  });
}

try {
  await waitForServer();
  const malformedSocket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const malformedInbox = new Inbox(malformedSocket);
  await new Promise((resolve, reject) => {
    malformedSocket.once("open", resolve);
    malformedSocket.once("error", reject);
  });
  malformedSocket.send("null");
  await malformedInbox.next((message) => message.type === "action_rejected");
  malformedSocket.close();
  const healthyAfterMalformed = await fetch(`${origin}/api/health`);
  if (!healthyAfterMalformed.ok) throw new Error("Malformed payload stopped the server");

  const created = await fetch(`${origin}/api/rooms`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ variant: "devil", turnSeconds: 45 }),
  });
  const { roomCode } = await created.json();
  if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(roomCode)) {
    throw new Error("Invalid room code");
  }

  const host = await openPlayer(roomCode, "Хозяин", "foxy", true);
  const hostConnected = await host.inbox.next((message) => message.type === "connected");
  const guest = await openPlayer(roomCode, "Гость", "cupcake", false);
  const guestConnected = await guest.inbox.next((message) => message.type === "connected");
  await host.inbox.next((message) => message.type === "lobby_state" && message.players.length === 2);

  host.socket.send(JSON.stringify({
    type: "update_settings",
    variant: "classic",
    turnSeconds: 15,
    actionId: "settings-1",
  }));
  await host.inbox.next((message) => message.type === "action_ack" && message.actionId === "settings-1");
  await guest.inbox.next((message) =>
    message.type === "lobby_state" &&
    message.settings.variant === "classic" &&
    message.settings.turnSeconds === 15,
  );

  host.socket.send(JSON.stringify({ type: "start_game", actionId: "start-1" }));
  await host.inbox.next((message) => message.type === "action_ack" && message.actionId === "start-1");
  const hostGame = await host.inbox.next((message) => message.type === "game_state");
  const guestGame = await guest.inbox.next((message) => message.type === "game_state");

  if (hostGame.state.players[0].name !== "Хозяин") throw new Error("Host projection is not relative");
  if (guestGame.state.players[0].name !== "Гость") throw new Error("Guest projection is not relative");
  if (!hostGame.state.players[1].hand.every((card) => card.id.startsWith("hidden-"))) {
    throw new Error("Guest cards leaked to host");
  }
  if (!guestGame.state.players[1].hand.every((card) => card.id.startsWith("hidden-"))) {
    throw new Error("Host cards leaked to guest");
  }

  const active = hostGame.state.currentSeat === 0
    ? { player: host, state: hostGame.state }
    : { player: guest, state: guestGame.state };
  active.player.socket.send(JSON.stringify({
    type: "player_action",
    action: { type: "play_cards", cardIds: [active.state.players[0].hand[0].id] },
    actionId: "play-1",
  }));
  await active.player.inbox.next((message) => message.type === "action_ack" && message.actionId === "play-1");
  await host.inbox.next((message) => message.type === "game_state" && message.state.pile.length === 1);
  await guest.inbox.next((message) => message.type === "game_state" && message.state.pile.length === 1);

  host.socket.close();
  guest.socket.close();
  process.stdout.write(JSON.stringify({
    ok: true,
    roomCode,
    hostId: hostConnected.playerId,
    guestId: guestConnected.playerId,
    synchronizedFirstTurn: true,
  }));
} finally {
  server.kill("SIGTERM");
}
