import ContactForm from "./ContactForm";
import type { ContactContent, MetaContent, ProfileContent } from "@/lib/types";

export default function Contact({
  contact,
  profile,
  meta,
}: {
  contact: ContactContent;
  profile: ProfileContent;
  meta: MetaContent;
}) {
  return (
    <>
      <div className="contact">
        <h2>{contact.heading}</h2>
        <p>{contact.text}</p>
        <ContactForm email={profile.email} />
        <div className="social">
          {profile.socials.map((social, index) => (
            <a
              className="btn sm"
              key={index}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {social.label}
            </a>
          ))}
        </div>
        <div className="meta">
          <span>{profile.phone}</span>
          <span>{profile.location}</span>
          <span>{profile.availability}</span>
        </div>
      </div>
      <footer>
        <span>{meta.footerText}</span>
        <span>{meta.footerLocation}</span>
      </footer>
    </>
  );
}
