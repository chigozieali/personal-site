import type { ReactNode } from "react";

export default function Section({
  id,
  title,
  aside,
  style,
  children,
}: {
  id: string;
  title: string;
  aside?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  return (
    <section id={id} style={style}>
      <div className="row">
        <div>
          <h2>{title}</h2>
          {aside ? <p className="aside">{aside}</p> : null}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}
