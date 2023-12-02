import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	const session = await event.locals.auth.validate();
	if (!session?.user) throw redirect(302, '/auth/sign-in');
	return {
		user: session.user
	};
};
