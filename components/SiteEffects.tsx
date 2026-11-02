"use client";

import { useEffect } from "react";

export default function SiteEffects({ typedWords }: { typedWords: string[] }) {
  useEffect(() => {
    const root = document.documentElement;
    const nav = document.querySelector(".links") as HTMLElement | null;
    const links = nav ? Array.from(nav.querySelectorAll("a")) : [];
    const targets = links.map((link) =>
      document.getElementById(link.getAttribute("href")?.slice(1) ?? ""),
    );
    const progress = document.getElementById("progress") as HTMLElement | null;
    const animationFrames = new Set<number>();
    const revealTimers = new Set<number>();
    const pointerListeners: Array<{
      element: HTMLElement;
      handler: (event: PointerEvent) => void;
    }> = [];
    let revealObserver: IntersectionObserver | null = null;
    let counterObserver: IntersectionObserver | null = null;
    let scrollFrame = 0;
    let currentSection = -1;

    function updateScroll() {
      if (nav) {
        const line = 130;
        let index = -1;
        for (let i = 0; i < targets.length; i += 1) {
          const target = targets[i];
          if (target && target.getBoundingClientRect().top <= line) {
            index = i;
          }
        }
        const atEnd =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 4;
        const last = index === targets.length - 1 ? targets[index] : undefined;
        const contact = document.getElementById("contact");
        if (
          atEnd ||
          (last && last.getBoundingClientRect().bottom < line) ||
          (contact && contact.getBoundingClientRect().top <= line + 120)
        ) {
          index = -1;
        }

        if (index !== currentSection) {
          currentSection = index;
          links.forEach((link, linkIndex) => {
            const active = linkIndex === index;
            link.classList.toggle("on", active);
            if (active) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
          if (index > -1) {
            const active = links[index];
            nav.scrollTo({
              left: active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2,
              behavior: "smooth",
            });
          }
        }
      }

      if (progress) {
        const height =
          document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform =
          "scaleX(" + (height > 0 ? Math.min(1, window.scrollY / height) : 0) + ")";
      }
    }

    function scheduleScrollUpdate() {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        animationFrames.delete(scrollFrame);
        scrollFrame = 0;
        updateScroll();
      });
      animationFrames.add(scrollFrame);
    }

    window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
    window.addEventListener("resize", scheduleScrollUpdate);
    updateScroll();

    if ("IntersectionObserver" in window) {
      const selector =
        ".row > div:first-child, .about p, .facts div, .item, .svc article, .svc-cta, .skills > div, .certs li, .road-h, .proj li, .nums div, .contact";
      const fold = window.innerHeight * 0.92;
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const element = entry.target as HTMLElement;
            revealObserver?.unobserve(element);
            element.classList.add("in");
            const timer = window.setTimeout(() => {
              revealTimers.delete(timer);
              element.classList.remove("rv", "in", "rv-line");
              element.style.removeProperty("--d");
            }, 2600);
            revealTimers.add(timer);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
      );
      const seen = new Map<Element, number>();
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        if (element.getBoundingClientRect().top < fold) return;
        const parent = element.parentElement;
        if (!parent) return;
        const index = seen.get(parent) ?? 0;
        seen.set(parent, index + 1);
        element.style.setProperty("--d", Math.min(index, 6) * 80 + "ms");
        element.classList.add("rv");
        element.querySelectorAll<HTMLElement>(".tag").forEach((tag, tagIndex) => {
          tag.style.setProperty("--i", String(tagIndex));
        });
        revealObserver?.observe(element);
      });
      document.querySelectorAll<HTMLElement>(".row").forEach((row) => {
        if (row.getBoundingClientRect().top < fold) return;
        row.classList.add("rv-line");
        revealObserver?.observe(row);
      });
    }

    if ("IntersectionObserver" in window) {
      counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const element = entry.target as HTMLElement;
            counterObserver?.unobserve(element);
            const full = element.dataset.count ?? element.textContent ?? "";
            const end = parseInt(full, 10);
            const suffix = full.replace(/[0-9]/g, "");
            if (isNaN(end)) return;
            let start: number | null = null;
            function step(now: number) {
              if (start === null) start = now;
              const progress = Math.min(1, (now - start) / 1400);
              const eased = 1 - Math.pow(1 - progress, 3);
              element.textContent = Math.round(end * eased) + suffix;
              if (progress < 1) {
                const frame = window.requestAnimationFrame((nextTime) => {
                  animationFrames.delete(frame);
                  step(nextTime);
                });
                animationFrames.add(frame);
              }
            }
            element.textContent = "0" + suffix;
            const frame = window.requestAnimationFrame((now) => {
              animationFrames.delete(frame);
              step(now);
            });
            animationFrames.add(frame);
          });
        },
        { threshold: 0.6 },
      );
      document.querySelectorAll(".nums strong").forEach((element) => {
        counterObserver?.observe(element);
      });
    }

    if (window.matchMedia("(hover: hover)").matches) {
      const hero = document.querySelector(".hero") as HTMLElement | null;
      if (hero) {
        const handler = (event: PointerEvent) => {
          const rect = hero.getBoundingClientRect();
          hero.style.setProperty("--gx", event.clientX - rect.left + "px");
          hero.style.setProperty("--gy", event.clientY - rect.top + "px");
        };
        hero.addEventListener("pointermove", handler);
        pointerListeners.push({ element: hero, handler });
      }
      document.querySelectorAll<HTMLElement>(".proj li").forEach((item) => {
        const handler = (event: PointerEvent) => {
          const rect = item.getBoundingClientRect();
          item.style.setProperty("--mx", event.clientX - rect.left + "px");
          item.style.setProperty("--my", event.clientY - rect.top + "px");
        };
        item.addEventListener("pointermove", handler);
        pointerListeners.push({ element: item, handler });
      });
    }

    root.dataset.effects = "ready";

    return () => {
      window.removeEventListener("scroll", scheduleScrollUpdate);
      window.removeEventListener("resize", scheduleScrollUpdate);
      animationFrames.forEach((frame) => window.cancelAnimationFrame(frame));
      revealTimers.forEach((timer) => window.clearTimeout(timer));
      revealObserver?.disconnect();
      counterObserver?.disconnect();
      pointerListeners.forEach(({ element, handler }) => {
        element.removeEventListener("pointermove", handler);
      });
      delete root.dataset.effects;
    };
  }, []);

  /* typing line */
  useEffect(() => {
    const typed = document.getElementById("typed");
    const words = typedWords;
    if (!typed || words.length === 0) return;

    const typedEl = typed;
    let index = 0;
    let text = words[0];
    let erasing = false;
    let timeout = 0;

    function tick() {
      let delay: number;
      if (erasing) {
        text = text.slice(0, -1);
        delay = 26;
        if (!text) {
          erasing = false;
          index = (index + 1) % words.length;
        }
      } else if (text.length < words[index].length) {
        text = words[index].slice(0, text.length + 1);
        delay = 55;
      } else {
        erasing = true;
        delay = 1800;
      }
      typedEl.textContent = text;
      timeout = window.setTimeout(tick, delay);
    }

    timeout = window.setTimeout(() => {
      erasing = true;
      tick();
    }, 2400);

    return () => window.clearTimeout(timeout);
  }, [typedWords]);

  return null;
}
