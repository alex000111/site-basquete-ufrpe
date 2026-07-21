import { getStore } from "@netlify/blobs";
import { getCurrentUser } from "../../site-auth";

type Signature = {
  gameId: number;
  role: string;
  dataUrl: string;
  signedBy: string;
  signedAt: string;
  updatedBy: string;
};

const allowedRoles = new Set([
  "apontador", "cronometrista", "operador", "representante",
  "arbitro", "fiscal1", "fiscal2", "capitao",
]);

const signaturesStore = () => getStore({ name: "rural-signatures", consistency: "strong" });

async function readSignatures(gameId: number) {
  return (await signaturesStore().get(`games/${gameId}`, { type: "json" }) as Record<string, Signature> | null) || {};
}

export async function GET(request: Request) {
  if (!(await getCurrentUser())) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const gameId = Number(new URL(request.url).searchParams.get("gameId"));
  if (!gameId) return Response.json({ error: "Partida inválida" }, { status: 400 });
  const signatures = Object.values(await readSignatures(gameId)).sort((a, b) => a.role.localeCompare(b.role));
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
  const all = await readSignatures(gameId);
  const signature: Signature = {
    gameId,
    role,
    dataUrl,
    signedBy: String(body.signedBy || "").trim().slice(0, 100),
    signedAt: new Date().toISOString(),
    updatedBy: user.displayName,
  };
  await signaturesStore().setJSON(`games/${gameId}`, { ...all, [role]: signature });
  return Response.json({ signature });
}

export async function DELETE(request: Request) {
  if (!(await getCurrentUser())) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const url = new URL(request.url);
  const gameId = Number(url.searchParams.get("gameId"));
  const role = String(url.searchParams.get("role") || "");
  if (!gameId || !allowedRoles.has(role)) return Response.json({ error: "Assinatura inválida" }, { status: 400 });
  const all = await readSignatures(gameId);
  delete all[role];
  await signaturesStore().setJSON(`games/${gameId}`, all);
  return Response.json({ ok: true });
}
