import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@/components/pages/user/HomePage.css';
import { UserLayout } from '@/components/layout/UserLayout';
import ReduxProvider from '@/redux/ReduxProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Natura Travel", // Nên đổi lại title cho đúng dự án của bạn
  description: "Khám phá các tour du lịch tuyệt vời",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning // Khuyên dùng để tránh lỗi từ extension trình duyệt
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Bọc Provider ở ngoài cùng để cấp state cho toàn app */}
        <ReduxProvider>
          {/* Bọc Layout có chứa Navbar */}
          <UserLayout>
            {/* Nội dung các trang con (page.tsx) sẽ hiển thị ở đây */}
            {children}
          </UserLayout>
        </ReduxProvider>
      </body>
    </html>
  );
}