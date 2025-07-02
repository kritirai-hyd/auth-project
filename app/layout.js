import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "./Providers"; // ✅ Your custom wrapper

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "NextAuth App",
  description: "Next.js + NextAuth Demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
