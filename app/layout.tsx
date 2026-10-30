import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outbinched — Le Serment brisé",
  description: "Un jeu de rôle en pixel art et vue subjective, jouable dans le navigateur.",
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="fr"><body>{children}</body></html>;
}
