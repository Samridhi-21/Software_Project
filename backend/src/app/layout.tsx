export const metadata = {
  title: "Gym Hub — Smart Gym Management System",
  description: "Gym Hub member and coach workspace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#09090b", color: "#f4f4f5", fontFamily: "sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
