import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { BgBlobs } from "@/components/BgBlobs";
import { RevealObserver } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Africa Drug Discovery Database",
    template: "%s | Africa Drug Discovery DB",
  },
  description: "Search and browse chemical compounds and assay results from African drug discovery research.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="relative flex min-h-full flex-col overflow-x-hidden font-sans text-navy">
        <BgBlobs />
        <RevealObserver />
        <SiteHeader />
        <main className="container-wide relative z-10 w-full flex-1 py-8 sm:py-10">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
