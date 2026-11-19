import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Offscript Analytics | Private organiser report",
  description: "Private reporting for Offscript website and events.",
  robots: { index: false, follow: false, noarchive: true },
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
