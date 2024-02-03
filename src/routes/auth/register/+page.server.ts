import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users } from '$lib/dbSchema';
import { Argon2id } from 'oslo/password';
import { generateEmailVerificationCode, lucia } from '$lib/server/auth';
import { generateId } from 'lucia';
import { sendMail } from '$lib/mail';

export const load = (async (event) => {
	if (event.locals.user) {
		redirect(302, '/');
	}
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ cookies, request }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const username = formData.get('username');
		if (!email || typeof email !== 'string') {
			return fail(400, {
				message: 'invalid email'
			});
		}
		if (!username || typeof username !== 'string') {
			return fail(400, {
				message: 'invalid username'
			});
		}
		const password = formData.get('password');
		if (!password || typeof password !== 'string' || password.length < 6) {
			return fail(400, {
				message: 'password'
			});
		}

		const hashedPassword = await new Argon2id().hash(password);
		const userId = generateId(15);

		try {
			await db.insert(users).values({
				id: userId,
				email,
				hashedPassword,
				username
			});

			const session = await lucia.createSession(userId, {});
			const sessionCookie = lucia.createSessionCookie(session.id);

			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});

			const verificationCode = await generateEmailVerificationCode(userId, email);

			await sendMail(
				email,
				'Nouveau Compte',
				`Félicitations ${username}! Voici votre code: ${verificationCode}`,
				`Félicitations ${username} voici votre code: <div style='color:red'>${verificationCode}</div>`
			);
		} catch {
			return fail(400, { message: 'email already in user' });
		}

		return redirect(302, '/auth/verify-email');
	}
} satisfies Actions;
