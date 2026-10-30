"use client";

import { useRouter } from "next/navigation";
import { SETTINGS_NAV } from "@/lib/settings-nav";

/**
 * Desktop sidebar plus the mobile picker. Both drive the same `?tab=` URLs, so a tab
 * is still bookmarkable and survives a refresh.
 */
export default function SettingsSidebar({
  active,
  aiName,
}: {
  active: string;
  aiName: string | null;
}) {
  const router = useRouter();
  const go = (tab: string) => router.push(`/settings?tab=${tab}`);

  return (
    <>
      <nav className="st-side" aria-label="Settings sections">
        {SETTINGS_NAV.map((group) => (
          <div className="st-side-group" key={group.label}>
            <p>{group.label}</p>
            {group.items.map((item) => (
              <a
                key={item.tab}
                href={`/settings?tab=${item.tab}`}
                className={item.tab === active ? "on" : ""}
                aria-current={item.tab === active ? "page" : undefined}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                  event.preventDefault();
                  go(item.tab);
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        ))}
        <p className="st-side-foot">AI assistant: {aiName ?? "off"}</p>
      </nav>

      <label className="st-nav-mobile">
        <span>Section</span>
        <select value={active} onChange={(event) => go(event.target.value)}>
          {SETTINGS_NAV.map((group) => (
            <optgroup label={group.label} key={group.label}>
              {group.items.map((item) => (
                <option key={item.tab} value={item.tab}>
                  {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
    </>
  );
}
