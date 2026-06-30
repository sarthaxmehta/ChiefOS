import { auth } from "@/auth"
import LandingClient from "./LandingClient"

export default async function LandingPage() {
  const session = await auth();
  return <LandingClient session={session} />;
}
