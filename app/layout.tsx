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
        <script src="https://api-maps.yandex.ru/2.1/?lang=en_US"></script>
      </body>
    </html>
  );
}

export interface RootLayoutProps {
  children: ReactNode;
}
