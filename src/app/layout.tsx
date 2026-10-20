import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import "react-day-picker/style.css";
import "./globals.css";
import { Providers } from "@/components/Providers";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Casir+",
  description: "Aplikasi Kasir Modern",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={notoSerif.variable} suppressHydrationWarning>
      <body className={`${notoSerif.className} antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
