import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Young_Serif } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

const young = Young_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-young",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chigozie Alioha — IT Support to Cloud Engineer",
  description:
    "Chigozie Alioha is an IT support professional in Port Harcourt, Nigeria, working toward a Cloud Engineer role. Helpdesk, desktop support, infrastructure, Azure labs and networking.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeBoot = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${young.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
      {children}
      <Analytics />
      </body>
    </html>
  );
}
