import { db } from '$lib/db';
import type { PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';
import { users } from '$lib/dbSchema';

export const load: PageServerLoad = async ({ url }) => {


	const user = await db.query.users.findFirst({
		where: eq(users.id, url.searchParams.get('id') || '')
	}).execute();
	console.log(url.searchParams.get('id'), user);
	return {
		id: url.searchParams.get('id'),
		user: user
	};
};