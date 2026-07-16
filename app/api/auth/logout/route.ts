import { logout } from "../../../site-auth";
export async function POST(){await logout();return Response.json({ok:true})}
