import type { Metadata, Viewport } from "next";
import { Roboto, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import { VersionGuard } from "@/components/VersionGuard";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "HabitQuest: RPG de Hábitos",
  description: "Registre estudos e treinos em um RPG cooperativo com seu clã.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HabitQuest",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f2a93",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${roboto.variable} ${robotoCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#1a181d] text-[#f3f1f7] font-sans">
        <VersionGuard />
        {children}
      </body>
    </html>
  );
}
