import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getSiteContentFresh, hasDatabaseConfigured } from "@/lib/content";
import { aiProviderLabel } from "@/lib/ai";
import { DEFAULT_SETTINGS_TAB, isSettingsTab } from "@/lib/settings-nav";
import SettingsEditor from "@/components/settings/SettingsEditor";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/settings/login");

  const [content, params] = await Promise.all([getSiteContentFresh(), searchParams]);
  const tab = isSettingsTab(params.tab) ? params.tab : DEFAULT_SETTINGS_TAB;

  return (
    <SettingsEditor
      content={content}
      tab={tab}
      dbConnected={hasDatabaseConfigured()}
      aiName={aiProviderLabel()}
    />
  );
}
