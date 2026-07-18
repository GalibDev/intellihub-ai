import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { Footer, Navbar } from "@/components/site-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const metadata: Metadata = { title: { default: "IntelliHub AI — One intelligent workspace", template: "%s | IntelliHub AI" }, description: "Secure agentic AI tools for content, documents, data insights, chat, and recommendations.", icons: { icon: "/favicon.ico" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={inter.variable}><AppProviders><Navbar /><main className="min-h-[70vh]">{children}</main><Footer /></AppProviders></body></html>; }
