"use client";

import { useEffect } from "react";

export default function SiteEffects({ typedWords }: { typedWords: string[] }) {
  useEffect(() => {
    const root = document.documentElement;

    /* active section highlight in the top bar */
    const nav = document.querySelector(".links") as HTMLElement | null;
    if (nav) {
      const navEl = nav;
      const links = Array.from(navEl.querySelectorAll("a"));
      const targets = links.map((a) =>
        document.getElementById(a.getAttribute("href")?.slice(1) ?? ""),
      );
      let current = -1;
      let ticking = false;

      function spy() {
        ticking = false;
        const line = 130;
        let idx = -1;
        for (let i = 0; i < targets.length; i += 1) {
          const target = targets[i];
          if (target && target.getBoundingClientRect().top <= line) idx = i;
        }
        const atEnd =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 4;
        const last = idx === targets.length - 1 ? targets[idx] : undefined;
        if (atEnd || (last && last.getBoundingClientRect().bottom < line)) {
          idx = -1;
        }
        const contact = document.getElementById("contact");
        if (contact && contact.getBoundingClientRect().top <= line + 120) idx = -1;
        if (idx === current) return;
        current = idx;
        links.forEach((a, i) => {
          const on = i === idx;
          a.classList.toggle("on", on);
          if (on) a.setAttribute("aria-current", "location");
          else a.removeAttribute("aria-current");
        });
        if (idx > -1) {
          const active = links[idx];
          navEl.scrollTo({
            left: active.offsetLeft - (navEl.clientWidth - active.offsetWidth) / 2,
            behavior: "smooth",
          });
        }
      }

      window.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(spy);
          }
        },
        { passive: true },
      );
      window.addEventListener("resize", spy);
      spy();
    }

    /* reading progress bar */
    const bar = document.getElementById("progress");
    if (bar) {
      const progress = bar as HTMLElement;
      function prog() {
        const height =
          document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform =
          "scaleX(" + (height > 0 ? Math.min(1, window.scrollY / height) : 0) + ")";
      }
      window.addEventListener("scroll", prog, { passive: true });
      window.addEventListener("resize", prog);
      prog();
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* scroll reveal: only things below the first screen are hidden, so the top of the page is never blank */
    if ("IntersectionObserver" in window) {
      const selector =
        ".row > div:first-child, .about p, .facts div, .item, .svc article, .svc-cta, .skills > div, .certs li, .road-h, .proj li, .nums div, .contact";
      const fold = window.innerHeight * 0.92;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target as HTMLElement;
            observer.unobserve(el);
            el.classList.add("in");
            setTimeout(() => {
              el.classList.remove("rv", "in", "rv-line");
              el.style.removeProperty("--d");
            }, 2600);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
      );
      const seen = new Map<Element, number>();
      Array.from(document.querySelectorAll(selector)).forEach((raw) => {
        const el = raw as HTMLElement;
        if (el.getBoundingClientRect().top < fold) return;
        const parent = el.parentElement;
        if (!parent) return;
        const n = seen.get(parent) || 0;
        seen.set(parent, n + 1);
        el.style.setProperty("--d", Math.min(n, 6) * 80 + "ms");
        el.classList.add("rv");
        Array.from(el.querySelectorAll(".tag")).forEach((t, i) => {
          (t as HTMLElement).style.setProperty("--i", String(i));
        });
        observer.observe(el);
      });
      Array.from(document.querySelectorAll(".row")).forEach((row) => {
        if (reduce || row.getBoundingClientRect().top < fold) return;
        row.classList.add("rv-line");
        observer.observe(row);
      });
    }

    /* count-up numbers */
    if ("IntersectionObserver" in window) {
      const counter = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target as HTMLElement;
            counter.unobserve(el);
            /* read the target from the attribute: the text itself is rewritten while animating */
            const full = el.dataset.count ?? el.textContent ?? "";
            const end = parseInt(full, 10);
            const suffix = full.replace(/[0-9]/g, "");
            if (isNaN(end)) return;
            let start: number | null = null;
            function step(now: number) {
              if (start === null) start = now;
              const p = Math.min(1, (now - start) / 1400);
              const v = 1 - Math.pow(1 - p, 3);
              el.textContent = Math.round(end * v) + suffix;
              if (p < 1) requestAnimationFrame(step);
            }
            el.textContent = "0" + suffix;
            requestAnimationFrame(step);
          });
        },
        { threshold: 0.6 },
      );
      Array.from(document.querySelectorAll(".nums strong")).forEach((el) =>
        counter.observe(el),
      );
    }

    /* pointer glow */
    if (window.matchMedia("(hover: hover)").matches) {
      const hero = document.querySelector(".hero") as HTMLElement | null;
      if (hero) {
        hero.addEventListener("pointermove", (event) => {
          const rect = hero.getBoundingClientRect();
          hero.style.setProperty("--gx", event.clientX - rect.left + "px");
          hero.style.setProperty("--gy", event.clientY - rect.top + "px");
        });
      }
      Array.from(document.querySelectorAll(".proj li")).forEach((li) => {
        const item = li as HTMLElement;
        item.addEventListener("pointermove", (event) => {
          const rect = item.getBoundingClientRect();
          item.style.setProperty("--mx", event.clientX - rect.left + "px");
          item.style.setProperty("--my", event.clientY - rect.top + "px");
        });
      });
    }

    root.dataset.effects = "ready";
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
      setTimeout(tick, delay);
    }

    const timeout = setTimeout(() => {
      erasing = true;
      tick();
    }, 2400);

    return () => clearTimeout(timeout);
  }, [typedWords]);

  return null;
}
