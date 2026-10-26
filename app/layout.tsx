import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Конструктор дэшбордов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="size-full">
      <body className={`size-full antialiased bg-dark text-secondary`}>
        {children}
        <script src="https://api-maps.yandex.ru/2.1/?lang=en_US"></script>
      </body>
    </html>
  );
}
