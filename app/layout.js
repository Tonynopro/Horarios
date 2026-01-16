import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Tec Horarios",
  description: "Monitor de horarios del ITCM",
  manifest: "/manifest.json", // <-- Esto es lo más importante
  themeColor: "#00529b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="flex h-screen overflow-hidden">
        {/* Componente Sidebar (lo haremos a continuación) */}
        <Sidebar />

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto bg-dark-bg">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
