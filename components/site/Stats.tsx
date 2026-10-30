import type { StatContent } from "@/lib/types";

export default function Stats({ stats }: { stats: StatContent[] }) {
  return (
    <div className="nums">
      {stats.map((stat, index) => (
        <div key={stat.id ?? index}>
          <strong data-count={stat.value}>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
