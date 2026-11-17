import type { Metadata } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserLayout } from '@/components/layout/UserLayout';
import ReduxProvider from '@/redux/ReduxProvider';

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-roboto",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Natura Travel",
  description: "Khám phá các tour du lịch tuyệt vời",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${roboto.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className={`${roboto.className} min-h-full flex flex-col font-sans`} suppressHydrationWarning>
        <ReduxProvider>
          <UserLayout>
            {children}
          </UserLayout>
        </ReduxProvider>
      </body>
    </html>
  );
}
