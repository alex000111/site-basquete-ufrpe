import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { games } from "../../../db/schema";
import { getCurrentUser } from "../../site-auth";

async function authorized() {
  return getCurrentUser();
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select().from(games).orderBy(asc(games.gameDate), asc(games.gameTime));
    const now = Date.now();
    const automatic = rows.map((game) => {
      let effectiveStatus = game.status;
      if (["Confirmado", "A confirmar"].includes(game.status) && game.gameDate && game.gameTime) {
        const scheduled = new Date(`${game.gameDate}T${game.gameTime}:00-03:00`).getTime();
        const difference = scheduled - now;
        if (difference <= 30 * 60_000 && difference > 0) effectiveStatus = "Começa em breve";
        else if (difference <= 0 && difference > -3 * 60 * 60_000) effectiveStatus = "Ao vivo — aguardando início";
        else if (difference <= -3 * 60 * 60_000) effectiveStatus = "Aguardando atualização";
      }
      return { ...game, effectiveStatus };
    });
    return Response.json({ games: automatic, timezone: "America/Recife" });
  } catch {
    return Response.json({ games: [] });
  }
}

export async function POST(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const body = await request.json() as Record<string, string | number>;
  if (!String(body.opponent ?? "").trim() || !String(body.gameDate ?? "").trim()) return Response.json({ error: "Adversário e data são obrigatórios" }, { status: 400 });
  const db = await getDb();
  const [game] = await db.insert(games).values({
    opponent: String(body.opponent), gameDate: String(body.gameDate), gameTime: String(body.gameTime ?? ""),
    location: String(body.location ?? "Ginásio da UFRPE"), competition: String(body.competition ?? ""),
    status: String(body.status ?? "Confirmado"), ruralScore: Number(body.ruralScore ?? 0),
    opponentScore: Number(body.opponentScore ?? 0), summary: String(body.summary ?? ""), youtubeUrl:String(body.youtubeUrl??""), period:Number(body.period??1), clockSeconds:Number(body.clockSeconds??600), clockRunning:Boolean(body.clockRunning), ruralFouls:Number(body.ruralFouls??0), opponentFouls:Number(body.opponentFouls??0), ruralTimeouts:Number(body.ruralTimeouts??0), opponentTimeouts:Number(body.opponentTimeouts??0),
  }).returning();
  return Response.json({ game }, { status: 201 });
}

export async function PUT(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const body = await request.json() as Record<string, string | number>;
  const id = Number(body.id);
  const db = await getDb();
  const [game] = await db.update(games).set({
    opponent: String(body.opponent), gameDate: String(body.gameDate), gameTime: String(body.gameTime ?? ""),
    location: String(body.location), competition: String(body.competition ?? ""), status: String(body.status),
    ruralScore: Number(body.ruralScore ?? 0), opponentScore: Number(body.opponentScore ?? 0),
    summary: String(body.summary ?? ""), youtubeUrl:String(body.youtubeUrl??""), period:Number(body.period??1), clockSeconds:Number(body.clockSeconds??600), clockRunning:Boolean(body.clockRunning), ruralFouls:Number(body.ruralFouls??0), opponentFouls:Number(body.opponentFouls??0), ruralTimeouts:Number(body.ruralTimeouts??0), opponentTimeouts:Number(body.opponentTimeouts??0), updatedAt: new Date().toISOString(),
  }).where(eq(games.id, id)).returning();
  return Response.json({ game });
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  const db = await getDb();
  await db.delete(games).where(eq(games.id, id));
  return Response.json({ ok: true });
}
