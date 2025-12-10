import type { Metadata } from "next";
import { Open_Sans, Poppins, Montserrat } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const openSans = Open_Sans({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
    variable: "--font-headline",
    display: "swap",
});

const montserrat = Montserrat({
    subsets: ["latin"],
    variable: "--font-body",
    display: "swap",
});

const siteUrl = "https://oduoloc.com.br";

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    icons: {
        icon: "/icon.svg",
        apple: "/icon.svg",
    },
    title: {
        default: "ODuoLoc - Sistema de Gestão para Locadoras de Equipamentos",
        template: "%s | ODuoLoc"
    },
    description: "Sistema completo para locadoras de equipamentos. Gerencie reservas, clientes, estoque e financeiro em uma plataforma moderna. Controle total da sua locadora com relatórios, calendário e automações.",
    keywords: [
        "sistema para locadora",
        "software de locação",
        "gestão de locadora",
        "sistema de reservas",
        "controle de equipamentos",
        "aluguel de equipamentos",
        "locadora de equipamentos",
        "sistema para aluguel",
        "software locadora",
        "gestão de aluguel",
        "controle de reservas",
        "sistema locação equipamentos",
        "erp locadora",
        "software gestão locadora",
        "plataforma locação",
        "locadora de ferramentas",
        "locadora de máquinas",
        "locadora de andaimes",
        "locadora de geradores",
        "locadora de containers"
    ],
    authors: [{ name: "ODuo Assessoria", url: siteUrl }],
    creator: "ODuo Assessoria",
    publisher: "ODuo Assessoria",
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    openGraph: {
        type: "website",
        locale: "pt_BR",
        url: siteUrl,
        siteName: "ODuoLoc",
        title: "ODuoLoc - Sistema de Gestão para Locadoras de Equipamentos",
        description: "A plataforma mais completa para locadoras. Gerencie reservas, estoque, clientes e financeiro.",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "ODuoLoc - Sistema para Locadoras",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "ODuoLoc - Sistema de Gestão para Locadoras",
        description: "Gerencie sua locadora com a plataforma mais moderna do mercado. Reservas, estoque, financeiro e muito mais.",
        images: ["/og-image.png"],
        creator: "@oduoloc",
    },
    alternates: {
        canonical: siteUrl,
    },
    category: "technology",
    classification: "Business Software",
    verification: {
        google: "seu-codigo-google-search-console",
    },
    other: {
        "geo.region": "BR",
        "geo.placename": "Brasil",
        "rating": "general",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" className="dark">
            <body className={cn(
                openSans.variable,
                poppins.variable,
                montserrat.variable,
                "min-h-screen bg-background antialiased"
            )}>
                {children}
                <Toaster />
            </body>
        </html>
    );
}
