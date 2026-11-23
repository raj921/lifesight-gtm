import type { Metadata } from "next";
import { Geist_Mono, Inter, Newsreader } from "next/font/google";
import { Sidebar, TopBar } from "@/components/nav";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["normal", "italic"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Signal Desk",
  description: "Who to call today, why, and what to say. A GTM prototype for Lifesight.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} ${mono.variable} antialiased`}>
      <body className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-[1600px] gap-2 p-2">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col pt-1 lg:pt-0">
            <TopBar />
            <main className="flex-1 rounded-2xl border border-line bg-container p-4 md:p-7">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
