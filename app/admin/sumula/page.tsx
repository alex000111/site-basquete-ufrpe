import Sumula from "./sumula";
import { getCurrentUser } from "../../site-auth";

export const dynamic = "force-dynamic";

export default async function SumulaPage() {
  const user = await getCurrentUser();
  return <Sumula authorized={Boolean(user)} />;
}
