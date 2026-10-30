export type SocialLink = { label: string; href: string };
export type CtaLink = { label: string; href: string };

/** Database rows carry their row id so the editor can update or delete them. */
export type Identified = { id?: string };

export type MetaContent = {
  title: string;
  description: string;
  footerText: string;
  footerLocation: string;
};

export type ProfileContent = {
  name: string;
  initials: string;
  tagline: string;
  location: string;
  email: string;
  phone: string;
  availability: string;
  currentRole: string;
  movingInto: string;
  socials: SocialLink[];
};

export type HeroContent = {
  headlineBefore: string;
  headlineHighlight: string;
  lead: string;
  typedWords: string[];
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
};

export type Fact = { label: string; value: string };

export type AboutContent = {
  paragraphs: string[];
  facts: Fact[];
};

export type ServicesCtaContent = { text: string; label: string };
export type ContactContent = { heading: string; text: string };

export type NowContent = Identified & {
  heading: string;
  bullets: string[];
  updated: string;
};
export type StatContent = Identified & { value: string; label: string };
export type ExperienceContent = Identified & {
  when: string;
  title: string;
  sub: string;
  bullets: string[];
  upcoming?: boolean;
};
export type ServiceContent = Identified & {
  title: string;
  desc: string;
  bullets: string[];
};
export type SkillTag = { label: string; hot?: boolean };
export type SkillGroupContent = Identified & { group: string; items: SkillTag[] };
export type CertificateContent = Identified & {
  title: string;
  issuer: string;
  desc: string;
};
export type RoadmapContent = Identified & {
  code: string;
  title: string;
  status: string;
  active: boolean;
};
export type ProjectContent = Identified & {
  category: string;
  date: string;
  type: string;
  title: string;
  desc: string;
  tags: string[];
  link?: string;
  linkLabel?: string;
  privateNote?: string;
};

export type SiteSettings = {
  meta: MetaContent;
  profile: ProfileContent;
  hero: HeroContent;
  about: AboutContent;
  servicesCta: ServicesCtaContent;
  contact: ContactContent;
};

export type SiteItems = {
  now: NowContent[];
  stats: StatContent[];
  experience: ExperienceContent[];
  services: ServiceContent[];
  skills: SkillGroupContent[];
  certificates: CertificateContent[];
  roadmap: RoadmapContent[];
  projects: ProjectContent[];
};

export type SiteContent = {
  settings: SiteSettings;
  items: SiteItems;
};

export const COLLECTIONS = [
  "now",
  "stats",
  "experience",
  "services",
  "skills",
  "certificates",
  "roadmap",
  "projects",
] as const;

export type CollectionKey = (typeof COLLECTIONS)[number];

export const SETTING_KEYS = [
  "meta",
  "profile",
  "hero",
  "about",
  "servicesCta",
  "contact",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export const COLLECTION_LABELS: Record<CollectionKey, string> = {
  now: "Right now",
  stats: "Stats",
  experience: "Experience",
  services: "Services",
  skills: "Skills",
  certificates: "Certificates",
  roadmap: "Roadmap",
  projects: "Projects",
};

export const SETTING_LABELS: Record<SettingKey, string> = {
  meta: "Site & footer",
  profile: "Profile",
  hero: "Hero",
  about: "About",
  servicesCta: "Services call to action",
  contact: "Contact",
};

export function isCollectionKey(value: string): value is CollectionKey {
  return (COLLECTIONS as readonly string[]).includes(value);
}

export function isSettingKey(value: string): value is SettingKey {
  return (SETTING_KEYS as readonly string[]).includes(value);
}
