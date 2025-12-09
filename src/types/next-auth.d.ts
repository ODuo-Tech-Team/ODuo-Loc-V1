import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string
            tenantId: string
            tenantName: string
            tenantSlug: string
            role: string
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        tenantId: string
        tenantName: string
        tenantSlug: string
        role: string
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string
        tenantId: string
        tenantName: string
        tenantSlug: string
        role: string
    }
}
