import { fromNodeHeaders } from "better-auth/node";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { Auth } from "./auth.js";
export type OrganizerSession = {
    user: {
        id: string;
        name: string;
        email: string;
    };
    session: {
        id: string;
        userId: string;
    };
};
export async function getOrganizerSession(auth: Auth, request: FastifyRequest): Promise<OrganizerSession | null> {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
    });
    if (!session?.user) {
        return null;
    }
    return {
        user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
        },
        session: {
            id: session.session.id,
            userId: session.session.userId,
        },
    };
}
export async function requireOrganizerSession(auth: Auth, request: FastifyRequest, reply: FastifyReply): Promise<OrganizerSession | null> {
    const session = await getOrganizerSession(auth, request);
    if (!session) {
        await reply.status(401).send({
            error: {
                code: "UNAUTHORIZED",
                message: "Wymagane zalogowanie organizatora.",
            },
        });
        return null;
    }
    return session;
}
