import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate, message } from 'sveltekit-superforms/server';
import { auth } from '$lib/server/lucia';
import { userSchema } from '$lib/config/zod-schemas';
import { db } from '../../../db/db';
import { userKey } from '../../../db/schema';
import { eq } from 'drizzle-orm';

const profileSchema = userSchema.pick({
	name: true,
	email: true
});

export const load = async (event) => {
	const form = await superValidate(event, profileSchema);
	const session = await event.locals.auth.validate();
	if (!session?.user) {
		return;
	}

	form.data = {
		name: session.user.name,
		email: session.user.email
	};
	return {
		form
	};
};

export const actions = {
	default: async (event) => {
		const form = await superValidate(event, profileSchema);
		//console.log(form);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const session = await event.locals.auth.validate();
			if (!session?.user) {
				return;
			}

			await auth.updateUserAttributes(session.user.userId, {
				name: form.data.name,
				email: form.data.email
			});
			await db
				.update(userKey)
				.set({ id: `emailpassword:${form.data.email}` })
				.where(eq(userKey.userId, session.user.userId));
		} catch (e) {
			console.error(e);
			return setError(form, null, 'There was a problem updating your profile.');
		}
		console.log('profile updated successfully');
		return message(form, 'Profile updated successfully.');
	}
};
