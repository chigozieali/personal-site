import type { Metadata } from "next";
import SiteEffects from "@/components/SiteEffects";
import About from "@/components/site/About";
import Certificates from "@/components/site/Certificates";
import Contact from "@/components/site/Contact";
import Experience from "@/components/site/Experience";
import Hero from "@/components/site/Hero";
import Projects from "@/components/site/Projects";
import Section from "@/components/site/Section";
import Services from "@/components/site/Services";
import Skills from "@/components/site/Skills";
import Stats from "@/components/site/Stats";
import TopBar from "@/components/site/TopBar";
import { getSiteContent } from "@/lib/content";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteContent();
  return {
    title: settings.meta.title,
    description: settings.meta.description,
  };
}

export default async function HomePage() {
  const { settings, items } = await getSiteContent();

  return (
    <>
      <TopBar name={settings.profile.name} initials={settings.profile.initials} />
      <main className="wrap" id="top">
        <Hero profile={settings.profile} hero={settings.hero} now={items.now[0]} />
        <Stats stats={items.stats} />

        <Section id="about" title="About">
          <About about={settings.about} />
        </Section>

        <Section
          id="experience"
          title="Experience"
          aside="A short version. Full details on request."
        >
          <Experience items={items.experience} />
        </Section>

        <Section
          id="services"
          title="Services"
          aside="Available for projects and roles, remote worldwide."
        >
          <Services items={items.services} cta={settings.servicesCta} />
        </Section>

        <Section
          id="skills"
          title="Skills"
          aside="Highlighted ones are what I'm sharpening right now."
        >
          <Skills groups={items.skills} />
        </Section>

        <Section
          id="certs"
          title="Certificates"
          aside="Support and security first, now building toward Azure."
        >
          <Certificates certificates={items.certificates} roadmap={items.roadmap} />
        </Section>

        <Section
          id="projects"
          title="Projects"
          aside="Azure labs, networking and web apps. Most link to the code."
        >
          <Projects projects={items.projects} />
        </Section>

        <section id="contact" style={{ paddingBottom: 0 }}>
          <Contact
            contact={settings.contact}
            profile={settings.profile}
            meta={settings.meta}
          />
        </section>
      </main>
      <SiteEffects typedWords={settings.hero.typedWords} />
    </>
  );
}
