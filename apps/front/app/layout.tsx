import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Конструктор дэшбордов",
};

export default function RootLayout(props: RootLayoutProps) {
  return (
    <html lang="en" className="size-full">
      <body className="size-full antialiased bg-dark text-secondary">
        {props.children}
      </body>
    </html>
  );
}

export interface RootLayoutProps {
  children: ReactNode;
}
