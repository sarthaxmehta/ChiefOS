import { auth } from "@/auth"
import { ChiefClient } from "./ChiefClient";

export default async function ChiefPage() {
  const session = await auth();
  const userName = session?.user?.name || "Executive";

  return (
    <ChiefClient initialUserName={userName} />
  );
}
