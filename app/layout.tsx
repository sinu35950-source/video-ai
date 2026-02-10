import "./globals.css";

export const metadata = {
  title: "Prompt to Video",
  description: "Generate videos from text prompts"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
