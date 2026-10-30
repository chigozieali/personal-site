import ThemeToggle from "@/components/ThemeToggle";
import NavMenu from "./NavMenu";

const NAV = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#services", label: "Services" },
  { href: "#skills", label: "Skills" },
  { href: "#certs", label: "Certificates" },
  { href: "#projects", label: "Projects" },
];

export default function TopBar({ name, initials }: { name: string; initials: string }) {
  return (
    <div className="bar">
      <div className="bar-in">
        <a className="brand" href="#top" aria-label={`${name}, top of page`}>
          <b>{initials}</b>
          <span>{name}</span>
        </a>
        <NavMenu links={NAV} />
        <ThemeToggle />
        <a className="btn pri sm" href="#contact">
          Hire me
        </a>
      </div>
      <div className="progress" id="progress" aria-hidden="true" />
    </div>
  );
}
