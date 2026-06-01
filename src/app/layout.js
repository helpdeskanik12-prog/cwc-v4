import './globals.css';
import ClientLayout from './ClientLayout';

export const metadata = { title: 'CINEWORLD — Stream Movies & Clips', description: 'Watch premium movies and clips' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-[#141414]">
      <body className="min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
