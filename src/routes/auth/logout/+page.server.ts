import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';

export const load = (async (event) => {
    if (event.locals.session) {
        await lucia.invalidateSession(event.locals.session.id);
        const sessionCookie = lucia.createBlankSessionCookie();
        event.cookies.set(sessionCookie.name, sessionCookie.value, {
            path: '.',
            ...sessionCookie.attributes
        });
        event.locals.user = null;
        event.locals.session = null;
    }
    return redirect(302, '/auth/login');
}) satisfies PageServerLoad;
