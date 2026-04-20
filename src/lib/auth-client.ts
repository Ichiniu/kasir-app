import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    // you can pass additional options here
})

export const { signIn, signOut, useSession } = authClient;
