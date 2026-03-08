import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "English Learning Platform",
  description: "A soft, artistic platform for learning English.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${lora.variable} antialiased bg-background text-foreground font-sans min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-primary">
                Lumina
              </Link>
              <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
                <Link href="/dashboard" className="hover:text-primary transition-colors">Personal Center</Link>
                <Link href="/articles" className="hover:text-primary transition-colors">Article Bank</Link>
                <Link href="/words" className="hover:text-primary transition-colors">Word Bank</Link>
                <Link href="/profile" className="hover:text-primary transition-colors">Profile</Link>
              </nav>
            </div>
          </header>
          <main className="flex-1 container mx-auto p-4 md:p-8">
            {children}
          </main>
        </AuthProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
