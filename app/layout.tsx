import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Конструктор дэшбордов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full h-full">
      <body
        className={`w-full h-full ${geistSans.variable} antialiased bg-dark text-secondary`}
      >
        {children}
        <script src="https://api-maps.yandex.ru/2.1/?lang=en_US"></script>
      </body>
    </html>
  );
}
