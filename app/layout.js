import './globals.css';

export const metadata = {
  title: 'AP Psych Quizzer',
  description: 'Chapter-based AP Psychology quiz app with stats tracking',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
