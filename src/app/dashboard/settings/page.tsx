import { getUserPreferences } from "@/app/dashboard/actions"
import SettingsClient from "./SettingsClient"

export default async function SettingsPage() {
  const initialData = await getUserPreferences();
  return <SettingsClient initialData={initialData} />;
}
