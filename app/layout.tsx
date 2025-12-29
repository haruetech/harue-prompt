import "./globals.css";

export const metadata = {
  title: "Leonardo Prompt Tool",
  description: "Apparel & Shoes Prompt Generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="kr-font">{children}</body>
    </html>
  );
}
