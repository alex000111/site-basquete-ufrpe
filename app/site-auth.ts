import { getStore } from "@netlify/blobs";
import { cookies } from "next/headers";

const COOKIE = "rural_session";
const SESSION_SECONDS = 7 * 24 * 60 * 60;

type StoredUser = {
  username: string;
  displayName: string;
  role: string;
  passwordHash: string;
  mustChangePassword: boolean;
  active: boolean;
};

type Session = {
  username: string;
  expiresAt: string;
};

const BOOTSTRAP: Record<string, { name: string; role: string }> = {
  igor: { name: "Igor", role: "admin" },
  laryssa: { name: "Laryssa", role: "staff" },
  ricardo: { name: "Ricardo Lima", role: "staff" },
  rinaldo: { name: "Rinaldo Elias", role: "staff" },
};

const authStore = () => getStore({ name: "rural-auth", consistency: "strong" });

export async function hash(value: string) {
  const bytes = new TextEncoder().encode(`basquetebol-rural::${value}`);
  const out = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(out)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function readUser(username: string) {
  return authStore().get(`users/${username}`, { type: "json" }) as Promise<StoredUser | null>;
}

async function publicUser(user: StoredUser) {
  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const store = authStore();
  const tokenHash = await hash(token);
  const session = await store.get(`sessions/${tokenHash}`, { type: "json" }) as Session | null;
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    if (session) await store.delete(`sessions/${tokenHash}`);
    return null;
  }

  const user = await readUser(session.username);
  if (!user?.active) return null;
  return publicUser(user);
}

export async function login(username: string, password: string) {
  const store = authStore();
  let user = await readUser(username);

  if (!user) {
    const seed = BOOTSTRAP[username];
    const initialPassword = process.env.RURAL_INITIAL_PASSWORD;
    if (!seed || !initialPassword || password !== initialPassword) return null;
    user = {
      username,
      displayName: seed.name,
      role: seed.role,
      passwordHash: await hash(password),
      mustChangePassword: true,
      active: true,
    };
    await store.setJSON(`users/${username}`, user);
  }

  if (!user.active || user.passwordHash !== await hash(password)) return null;

  const token = crypto.randomUUID() + crypto.randomUUID();
  await store.setJSON(`sessions/${await hash(token)}`, {
    username,
    expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString(),
  } satisfies Session);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return publicUser(user);
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await authStore().delete(`sessions/${await hash(token)}`);
  jar.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

export async function changePassword(newPassword: string) {
  const current = await getCurrentUser();
  if (!current) return false;
  const user = await readUser(current.username);
  if (!user) return false;
  await authStore().setJSON(`users/${user.username}`, {
    ...user,
    passwordHash: await hash(newPassword),
    mustChangePassword: false,
  } satisfies StoredUser);
  return true;
}
