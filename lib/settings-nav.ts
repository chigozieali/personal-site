import { COLLECTION_SPECS, SETTING_SPECS } from "./editor-spec";
import type { CollectionKey, SettingKey } from "./types";

export type SettingsNavItem = { tab: string; label: string };
export type SettingsNavGroup = { label: string; items: SettingsNavItem[] };

const setting = (key: SettingKey): SettingsNavItem => ({
  tab: key,
  label: SETTING_SPECS[key].label,
});

const collection = (key: CollectionKey): SettingsNavItem => ({
  tab: key,
  label: COLLECTION_SPECS[key].label,
});

/**
 * The editor groups its panels so the sidebar stays readable. The tab ids are the
 * same `?tab=` values the editor has always used, so old links keep working.
 */
export const SETTINGS_NAV: SettingsNavGroup[] = [
  {
    label: "Identity",
    items: [setting("profile"), setting("hero"), setting("about"), setting("meta")],
  },
  {
    label: "Work",
    items: [
      collection("experience"),
      collection("projects"),
      collection("services"),
      setting("servicesCta"),
    ],
  },
  {
    label: "Skills & proof",
    items: [collection("skills"), collection("certificates"), collection("roadmap")],
  },
  {
    label: "Numbers",
    items: [collection("stats"), collection("now")],
  },
  {
    label: "Contact",
    items: [setting("contact")],
  },
];

export const SETTINGS_TABS: string[] = SETTINGS_NAV.flatMap((group) =>
  group.items.map((item) => item.tab),
);

export const DEFAULT_SETTINGS_TAB = "profile";

export function isSettingsTab(value: string | undefined): value is string {
  return typeof value === "string" && SETTINGS_TABS.includes(value);
}
