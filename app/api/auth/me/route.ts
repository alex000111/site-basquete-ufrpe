import { getCurrentUser } from "../../../site-auth";
export async function GET(){const user=await getCurrentUser();return user?Response.json({user}):Response.json({user:null},{status:401})}
