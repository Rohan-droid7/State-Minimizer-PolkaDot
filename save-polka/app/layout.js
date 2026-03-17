import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Save Polka | EVM State Minimizer",
  description: "Cross-VM State Compression",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}