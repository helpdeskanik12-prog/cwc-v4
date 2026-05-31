import './globals.css';
export const metadata = { title: 'CINEWORLD — Stream Movies & Clips', description: 'Watch premium movies and clips' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-[#141414]">
      <body className="min-h-screen">
        <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/90 to-transparent px-6 py-4 flex items-center gap-6">
          <a href="/" className="text-red-600 font-bold text-2xl">CINEWORLD</a>
          <a href="/" className="text-sm hover:text-gray-300">Home</a>
          <a href="/admin" className="text-sm hover:text-gray-300">Admin</a>
        </nav>
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
