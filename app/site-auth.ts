import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../db";
import { sessions, users } from "../db/schema";

const COOKIE = "rural_session";
const BOOTSTRAP:Record<string,{name:string;role:string;password:string}> = {
  igor:{name:"Igor",role:"admin",password:"Rural@Igor26"},
  laryssa:{name:"Laryssa",role:"staff",password:"Rural@Laryssa26"},
  ricardo:{name:"Ricardo Lima",role:"staff",password:"Rural@Ricardo26"},
  rinaldo:{name:"Rinaldo Elias",role:"staff",password:"Rural@Rinaldo26"},
};

export async function hash(value:string){const bytes=new TextEncoder().encode(`basquetebol-rural::${value}`);const out=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(out)].map(b=>b.toString(16).padStart(2,"0")).join("")}
export async function getCurrentUser(){const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;const db=await getDb();const tokenHash=await hash(token);const rows=await db.select({id:users.id,username:users.username,displayName:users.displayName,role:users.role,mustChangePassword:users.mustChangePassword}).from(sessions).innerJoin(users,eq(sessions.userId,users.id)).where(and(eq(sessions.tokenHash,tokenHash),gt(sessions.expiresAt,new Date().toISOString()),eq(users.active,true))).limit(1);return rows[0]??null}
export async function login(username:string,password:string){const db=await getDb();let [user]=await db.select().from(users).where(eq(users.username,username)).limit(1);if(!user){const seed=BOOTSTRAP[username];if(!seed||password!==seed.password)return null;[user]=await db.insert(users).values({username,displayName:seed.name,role:seed.role,passwordHash:await hash(password),mustChangePassword:true}).returning()}if(user.passwordHash!==await hash(password)||!user.active)return null;const token=crypto.randomUUID()+crypto.randomUUID();await db.insert(sessions).values({userId:user.id,tokenHash:await hash(token),expiresAt:new Date(Date.now()+7*864e5).toISOString()});(await cookies()).set(COOKIE,token,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:7*86400});return user}
export async function logout(){const jar=await cookies();const token=jar.get(COOKIE)?.value;if(token){const db=await getDb();await db.delete(sessions).where(eq(sessions.tokenHash,await hash(token)))}jar.set(COOKIE,"",{httpOnly:true,secure:true,path:"/",maxAge:0})}
export async function changePassword(newPassword:string){const user=await getCurrentUser();if(!user)return false;const db=await getDb();await db.update(users).set({passwordHash:await hash(newPassword),mustChangePassword:false}).where(eq(users.id,user.id));return true}
