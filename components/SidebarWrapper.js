"use client";
import dynamic from "next/dynamic";

// Aquí sí está permitido el ssr: false porque este archivo es "use client"
const SidebarDeVerdad = dynamic(() => import("./Sidebar"), {
  ssr: false,
  loading: () => (
    <aside className="md:w-72 bg-card-bg h-screen border-r border-white/5 shrink-0" />
  ),
});

export default function SidebarWrapper() {
  return <SidebarDeVerdad />;
}
