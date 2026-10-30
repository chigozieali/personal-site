import type { CertificateContent, RoadmapContent } from "@/lib/types";

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Completed"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export default function Certificates({
  certificates,
  roadmap,
}: {
  certificates: CertificateContent[];
  roadmap: RoadmapContent[];
}) {
  return (
    <div>
      <ul className="certs">
        {certificates.map((certificate, index) => (
          <li key={certificate.id ?? index}>
            <Check />
            <h3>{certificate.title}</h3>
            <span className="by">{certificate.issuer}</span>
            <p>{certificate.desc}</p>
          </li>
        ))}
      </ul>
      <h3 className="road-h">On the roadmap</h3>
      <ul className="certs road">
        {roadmap.map((entry, index) => (
          <li key={entry.id ?? index}>
            <span className="code">{entry.code}</span>
            <div>
              <h3>{entry.title}</h3>
            </div>
            <span className={entry.active ? "st on" : "st"}>{entry.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
