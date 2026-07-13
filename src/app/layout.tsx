import type { Metadata } from "next";
import AppContextProvider from "@/components/app-context";
import PreferencesInitializer from "@/components/preferences-initializer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Todos",
    template: "%s · Todos",
  },
  description: "A minimalist daily todo list.",
  applicationName: "Todos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="auto">
      <body>
        <AppContextProvider>
          <PreferencesInitializer />
          {children}
        </AppContextProvider>
      </body>
    </html>
  );
}
