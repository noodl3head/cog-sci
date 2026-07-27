import './globals.css';

export const metadata = {
  title: 'GATE Psych Quizzer',
  description: 'GATE Psychology chapter practice, mocks and syllabus coverage tracking',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
