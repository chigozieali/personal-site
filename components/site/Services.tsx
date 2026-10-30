import type { ServiceContent, ServicesCtaContent } from "@/lib/types";

export default function Services({
  items,
  cta,
}: {
  items: ServiceContent[];
  cta: ServicesCtaContent;
}) {
  return (
    <div>
      <div className="svc">
        {items.map((service, index) => (
          <article key={service.id ?? index}>
            <h3>{service.title}</h3>
            <p>{service.desc}</p>
            <ul>
              {service.bullets.map((bullet, bulletIndex) => (
                <li key={bulletIndex}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="svc-cta">
        <span>{cta.text}</span>
        <a className="btn pri sm" href="#contact">
          {cta.label}
        </a>
      </div>
    </div>
  );
}
