import "./globals.css";
import SidebarWrapper from "@/components/SidebarWrapper";

export const metadata = {
  title: "Tec Horarios",
  description: "Monitor de horarios del ITCM",
  manifest: "/manifest.json",
  themeColor: "#00529b",
};

export const viewport = {
  themeColor: "#00529b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="flex h-screen overflow-hidden">
        {/* Usamos el Wrapper en lugar del Sidebar directo */}
        <SidebarWrapper />

        <main className="flex-1 overflow-y-auto bg-dark-bg">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
