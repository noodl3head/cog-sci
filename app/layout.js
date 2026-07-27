import './globals.css';
import AppNavigation from './components/AppNavigation';

export const metadata = {
  title: 'GATE Psych Quizzer',
  description: 'GATE Psychology chapter practice, mocks and syllabus coverage tracking',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="site-frame">
          <AppNavigation />
          <main className="site-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
