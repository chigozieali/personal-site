import type { ExperienceContent } from "@/lib/types";
import Inline from "./Inline";

export default function Experience({ items }: { items: ExperienceContent[] }) {
  return (
    <div>
      {items.map((item, index) => (
        <article className={item.upcoming ? "item next" : "item"} key={item.id ?? index}>
          <div className="when">{item.when}</div>
          <div>
            <h3>{item.title}</h3>
            <p className="sub">{item.sub}</p>
            <ul>
              {item.bullets.map((bullet, bulletIndex) => (
                <li key={bulletIndex}>
                  <Inline text={bullet} />
                </li>
              ))}
            </ul>
          </div>
        </article>
      ))}
    </div>
  );
}
