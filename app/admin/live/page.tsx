import { getCurrentUser } from "../../site-auth";
import LiveControl from "./live-control";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const user = await getCurrentUser();
  return <LiveControl authorized={Boolean(user)} />;
}
