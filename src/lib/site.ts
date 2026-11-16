/**
 * The public site address, used for the canonical link, sitemap and share tags.
 * 1. NEXT_PUBLIC_SITE_URL, if you set it (use this for a custom domain).
 * 2. On Vercel, the project's production domain (set automatically).
 * 3. localhost, for local development.
 */
function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = explicit || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}

export const SITE = {
  name: "Typing Exe",
  title: "Typing Exe — Type code. Understand it.",
  description:
    "Practice typing real JavaScript, TypeScript, Python, SQL, PHP, Linux, Git, Swift and Kotlin code while each line is explained as you type. Beginner and Pro levels. Free, no sign-up.",
  url: siteUrl(),
  keywords: [
    "typing practice",
    "code typing",
    "learn to code",
    "typing trainer for programmers",
    "JavaScript",
    "TypeScript",
    "Python",
    "SQL",
    "PHP",
    "Linux commands",
    "Git",
    "Swift",
    "Kotlin",
    "iOS and Android development",
    "technical typing",
  ],
};
