"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { OnboardingCheck } from "@/components/onboarding"

interface AdminLayoutClientProps {
    children: React.ReactNode
    tenantName: string
    userName: string
    userEmail: string
}

export function AdminLayoutClient({
    children,
    tenantName,
    userName,
    userEmail,
}: AdminLayoutClientProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-blue-500/30">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 z-50 h-full w-72 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
            >
                <Sidebar />
            </aside>

            {/* Main Content */}
            <div className="md:pl-72 flex flex-col min-h-screen transition-all duration-300">
                <Header
                    user={{
                        name: userName,
                        email: userEmail,
                        image: "" // Add user image logic if available
                    }}
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <OnboardingCheck>
                            {children}
                        </OnboardingCheck>
                    </div>
                </main>
            </div>
        </div>
    )
}
