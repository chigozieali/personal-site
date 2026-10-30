import type { AboutContent } from "@/lib/types";
import Inline from "./Inline";

export default function About({ about }: { about: AboutContent }) {
  return (
    <div className="about">
      {about.paragraphs.map((paragraph, index) => (
        <p key={index}>
          <Inline text={paragraph} />
        </p>
      ))}
      <dl className="facts">
        {about.facts.map((fact, index) => (
          <div key={index}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
