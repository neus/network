export const metadata = {
  title: 'NEUS Next.js Example',
  description: 'Next.js App Router integration with NEUS verification'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
