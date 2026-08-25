import './globals.css';
import AppNavigation from './components/AppNavigation';
import ClientStateSync from './components/ClientStateSync';

export const metadata = {
  title: 'GATE Psych Quizzer',
  description: 'GATE Psychology chapter practice, mocks and syllabus coverage tracking',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem('gate-theme')||'dark'}catch(e){document.documentElement.dataset.theme='dark'}` }} />
      </head>
      <body>
        <ClientStateSync />
        <div className="site-frame">
          <AppNavigation />
          <main className="site-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
