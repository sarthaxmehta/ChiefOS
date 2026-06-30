import { auth } from "@/auth"
import { ChiefClient } from "./ChiefClient";

export default async function ChiefPage() {
  const session = await auth();
  const userName = session?.user?.name || "Executive";
  const userEmail = session?.user?.email || "anonymous";

  return (
    <ChiefClient initialUserName={userName} userEmail={userEmail} />
  );
}
