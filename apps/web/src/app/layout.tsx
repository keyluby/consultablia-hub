import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Consultablia e-CF — Sistema de Facturación Electrónica",
  description: "Emisión y gestión de comprobantes fiscales electrónicos (e-CF) para la DGII de la República Dominicana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className} style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh', margin: 0 }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
