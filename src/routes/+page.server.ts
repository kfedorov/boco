import { db } from '$lib/db';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) {
		// TODO: new issue: redirect on back without javascript removes a history entry, but with
		// js, it actually keeps the status quo, holding the user hostage.
		return redirect(302, '/auth/login');
	}
	const users = await db.query.users
		.findMany({
			columns: { username: true, email: true, emailVerified: true }
		})
		.execute();

	return {
		id: url.searchParams.get('id'),
		users
	};
};
