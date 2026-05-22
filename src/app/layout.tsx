import type { Metadata, Viewport } from "next";
import { Archivo_Black, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MyCrewFest",
    template: "%s — MyCrewFest",
  },
  description:
    "L'app du festivalier — prépare, vis et souviens-toi de chaque festival avec ton crew.",
  metadataBase: new URL(
    process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    title: "MyCrewFest",
    description:
      "L'app du festivalier — prépare, vis et souviens-toi de chaque festival avec ton crew.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D0E12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${archivoBlack.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}
      style={{
        backgroundColor: "#0D0E12",
        colorScheme: "dark",
      }}
    >
      <head>
        <style
          // biome-ignore lint/security/noDangerouslySetInnerHtml: required for CSS variable override from next/font
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --font-display: var(--font-archivo-black), 'Impact', 'Helvetica Neue', sans-serif;
                --font-body: var(--font-space-grotesk), system-ui, -apple-system, sans-serif;
                --font-mono: var(--font-space-mono), ui-monospace, monospace;
              }
            `,
          }}
        />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
