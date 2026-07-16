import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { sumulaSignatures } from "../../../db/schema";
import { getCurrentUser } from "../../site-auth";

const allowedRoles = new Set([
  "apontador", "cronometrista", "operador", "representante",
  "arbitro", "fiscal1", "fiscal2", "capitao",
]);

export async function GET(request: Request) {
  if (!(await getCurrentUser())) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const gameId = Number(new URL(request.url).searchParams.get("gameId"));
  if (!gameId) return Response.json({ error: "Partida inválida" }, { status: 400 });
  const db = await getDb();
  const signatures = await db.select().from(sumulaSignatures)
    .where(eq(sumulaSignatures.gameId, gameId))
    .orderBy(asc(sumulaSignatures.role));
  return Response.json({ signatures });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const body = await request.json() as { gameId?: number; role?: string; dataUrl?: string; signedBy?: string };
  const gameId = Number(body.gameId);
  const role = String(body.role || "");
  const dataUrl = String(body.dataUrl || "");
  if (!gameId || !allowedRoles.has(role)) return Response.json({ error: "Assinatura inválida" }, { status: 400 });
  if (!dataUrl.startsWith("data:image/png;base64,") || dataUrl.length > 180_000) {
    return Response.json({ error: "Imagem de assinatura inválida ou muito grande" }, { status: 400 });
  }
  const db = await getDb();
  const values = {
    gameId,
    role,
    dataUrl,
    signedBy: String(body.signedBy || "").trim().slice(0, 100),
    signedAt: new Date().toISOString(),
    updatedBy: user.displayName,
  };
  await db.insert(sumulaSignatures).values(values).onConflictDoUpdate({
    target: [sumulaSignatures.gameId, sumulaSignatures.role],
    set: values,
  });
  const [signature] = await db.select().from(sumulaSignatures).where(and(
    eq(sumulaSignatures.gameId, gameId),
    eq(sumulaSignatures.role, role),
  )).limit(1);
  return Response.json({ signature });
}

export async function DELETE(request: Request) {
  if (!(await getCurrentUser())) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const url = new URL(request.url);
  const gameId = Number(url.searchParams.get("gameId"));
  const role = String(url.searchParams.get("role") || "");
  if (!gameId || !allowedRoles.has(role)) return Response.json({ error: "Assinatura inválida" }, { status: 400 });
  const db = await getDb();
  await db.delete(sumulaSignatures).where(and(
    eq(sumulaSignatures.gameId, gameId),
    eq(sumulaSignatures.role, role),
  ));
  return Response.json({ ok: true });
}
