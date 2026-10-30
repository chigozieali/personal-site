import type { SkillGroupContent } from "@/lib/types";

export default function Skills({ groups }: { groups: SkillGroupContent[] }) {
  return (
    <dl className="skills">
      {groups.map((group, index) => (
        <div key={group.id ?? index}>
          <dt>{group.group}</dt>
          <dd>
            {group.items.map((tag, tagIndex) => (
              <span className={tag.hot ? "tag hot" : "tag"} key={tagIndex}>
                {tag.label}
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
