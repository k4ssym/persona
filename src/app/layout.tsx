import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Виртуальный консультант",
  description: "Голосовой ИИ-ассистент",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
