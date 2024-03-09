import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { eq } from 'drizzle-orm';
import { Users } from '$lib/dbSchema';
import { fail, redirect } from '@sveltejs/kit';
import { Argon2id } from 'oslo/password';
import { lucia } from '$lib/server/auth';

export const load = (async (event) => {
    if (event.locals.user) {
        redirect(302, '/');
    }
}) satisfies PageServerLoad;

export const actions = {
    default: async ({ cookies, request }) => {
        const data = await request.formData();
        const email = data.get('email');
        const password = data.get('password');

        if (!password || !email || typeof email !== 'string' || typeof password != 'string') {
            return fail(422, { message: 'email or password missing' });
        }

        const user = await db.query.Users.findFirst({
            where: eq(Users.email, email)
        }).execute();

        if (!user) {
            return fail(400, { message: 'Invalid email or password' });
        }

        const passwordValid = await new Argon2id().verify(user.hashedPassword, password);

        if (!passwordValid) {
            return fail(400, { message: 'Invalid email or password' });
        }

        const session = await lucia.createSession(user.id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);

        cookies.set(sessionCookie.name, sessionCookie.value, {
            path: '.',
            ...sessionCookie.attributes
        });

        redirect(302, '/');
    }
} satisfies Actions;
