import "@/app/globals.css"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SuperAdminLayoutClient } from "@/components/super-admin/super-admin-layout-client"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Não autenticado
  if (!session) {
    redirect("/login")
  }

  // Não é super admin
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  return (
    <SuperAdminLayoutClient
      userName={session.user.name || ""}
      userEmail={session.user.email || ""}
    >
      {children}
    </SuperAdminLayoutClient>
  )
}
