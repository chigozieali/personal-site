import type { HeroContent, NowContent, ProfileContent } from "@/lib/types";
import HeroArt from "./HeroArt";
import Inline from "./Inline";

export default function Hero({
  profile,
  hero,
  now,
}: {
  profile: ProfileContent;
  hero: HeroContent;
  now?: NowContent;
}) {
  const note: NowContent = now ?? { heading: "Right now", bullets: [], updated: "" };

  return (
    <header className="hero">
      <div>
        <p className="where">
          <span className="avatar" aria-hidden="true">
            {profile.initials}
          </span>
          {profile.name} · {profile.tagline} · {profile.location}
        </p>
        <h1>
          {hero.headlineBefore}{" "}
          <span className="wavy">
            {hero.headlineHighlight}
            <svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
              <path
                pathLength={1}
                d="M2 7 Q 14 1 26 7 T 50 7 T 74 7 T 98 7 T 122 7 T 146 7 T 170 7 T 198 6"
                fill="none"
                stroke="var(--mark)"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>
        <p className="lead">
          <Inline text={hero.lead} />
        </p>
        <p className="typed">
          Ask me about <span id="typed">{hero.typedWords[0] ?? ""}</span>
          <i className="caret" aria-hidden="true" />
        </p>
        <div className="cta">
          <a className="btn pri" href={hero.primaryCta.href}>
            {hero.primaryCta.label}
          </a>
          <a className="btn" href={hero.secondaryCta.href}>
            {hero.secondaryCta.label}
          </a>
        </div>
      </div>
      <div className="hero-side">
        <HeroArt />
        <aside className="note" aria-label="What I'm doing right now">
          <h2>
            <i className="live" aria-hidden="true" />
            {note.heading}
          </h2>
          <ul>
            {note.bullets.map((bullet, index) => (
              <li key={index}>{bullet}</li>
            ))}
          </ul>
          <small>{note.updated}</small>
        </aside>
      </div>
    </header>
  );
}
