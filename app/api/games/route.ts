import { getStore } from "@netlify/blobs";
import { getCurrentUser } from "../../site-auth";

type Game = {
  id: number;
  opponent: string;
  gameDate: string;
  gameTime: string;
  location: string;
  competition: string;
  status: string;
  ruralScore: number;
  opponentScore: number;
  summary: string;
  youtubeUrl: string;
  period: number;
  clockSeconds: number;
  clockRunning: boolean;
  ruralFouls: number;
  opponentFouls: number;
  ruralTimeouts: number;
  opponentTimeouts: number;
  createdAt: string;
  updatedAt: string;
};

const gamesStore = () => getStore({ name: "rural-games", consistency: "strong" });

async function readGames() {
  return (await gamesStore().get("games", { type: "json" }) as Game[] | null) || [];
}

async function writeGames(games: Game[]) {
  await gamesStore().setJSON("games", games);
}

function automaticStatus(game: Game) {
  let effectiveStatus = game.status;
  if (["Confirmado", "A confirmar"].includes(game.status) && game.gameDate && game.gameTime) {
    const scheduled = new Date(`${game.gameDate}T${game.gameTime}:00-03:00`).getTime();
    const difference = scheduled - Date.now();
    if (difference <= 30 * 60_000 && difference > 0) effectiveStatus = "Começa em breve";
    else if (difference <= 0 && difference > -3 * 60 * 60_000) effectiveStatus = "Ao vivo — aguardando início";
    else if (difference <= -3 * 60 * 60_000) effectiveStatus = "Aguardando atualização";
  }
  return { ...game, effectiveStatus };
}

function values(body: Record<string, unknown>, existing?: Game): Game {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? Number(body.id || Date.now()),
    opponent: String(body.opponent || existing?.opponent || ""),
    gameDate: String(body.gameDate || existing?.gameDate || ""),
    gameTime: String(body.gameTime ?? existing?.gameTime ?? ""),
    location: String(body.location ?? existing?.location ?? "Ginásio da UFRPE"),
    competition: String(body.competition ?? existing?.competition ?? ""),
    status: String(body.status ?? existing?.status ?? "Confirmado"),
    ruralScore: Number(body.ruralScore ?? existing?.ruralScore ?? 0),
    opponentScore: Number(body.opponentScore ?? existing?.opponentScore ?? 0),
    summary: String(body.summary ?? existing?.summary ?? ""),
    youtubeUrl: String(body.youtubeUrl ?? existing?.youtubeUrl ?? ""),
    period: Number(body.period ?? existing?.period ?? 1),
    clockSeconds: Number(body.clockSeconds ?? existing?.clockSeconds ?? 600),
    clockRunning: Boolean(body.clockRunning ?? existing?.clockRunning ?? false),
    ruralFouls: Number(body.ruralFouls ?? existing?.ruralFouls ?? 0),
    opponentFouls: Number(body.opponentFouls ?? existing?.opponentFouls ?? 0),
    ruralTimeouts: Number(body.ruralTimeouts ?? existing?.ruralTimeouts ?? 0),
    opponentTimeouts: Number(body.opponentTimeouts ?? existing?.opponentTimeouts ?? 0),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function GET() {
  try {
    const games = await readGames();
    return Response.json({
      games: games.sort((a, b) => `${a.gameDate}${a.gameTime}`.localeCompare(`${b.gameDate}${b.gameTime}`)).map(automaticStatus),
      timezone: "America/Recife",
    });
  } catch {
    return Response.json({ games: [] });
  }
}

export async function POST(request: Request) {
  if (!(await getCurrentUser())) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  if (!String(body.opponent || "").trim() || !String(body.gameDate || "").trim()) {
    return Response.json({ error: "Adversário e data são obrigatórios" }, { status: 400 });
  }
  const games = await readGames();
  const game = values({ ...body, id: Math.max(0, ...games.map(item => item.id)) + 1 });
  await writeGames([...games, game]);
  return Response.json({ game }, { status: 201 });
}

export async function PUT(request: Request) {
  if (!(await getCurrentUser())) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const id = Number(body.id);
  const games = await readGames();
  const existing = games.find(game => game.id === id);
  if (!existing) return Response.json({ error: "Partida não encontrada" }, { status: 404 });
  const game = values(body, existing);
  await writeGames(games.map(item => item.id === id ? game : item));
  return Response.json({ game });
}

export async function DELETE(request: Request) {
  if (!(await getCurrentUser())) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  await writeGames((await readGames()).filter(game => game.id !== id));
  return Response.json({ ok: true });
}
