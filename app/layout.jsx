import "./globals.css";

export const metadata = {
  title: "ORACLE — Investment Intelligence",
  description: "Your personal AI investing agent",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="scanlines">{children}</body>
    </html>
  );
}
