import React from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex flex-col min-h-screen">
        {/* Navbar */}
        <Navbar />
        {/* Main Content */}
        <main className="flex-grow">{children}</main>
        {/* Footer */}
        <Footer />
      </div>
    </ThemeProvider>
  );
}