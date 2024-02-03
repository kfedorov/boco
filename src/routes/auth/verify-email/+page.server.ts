import type { PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { and, eq, gt, sql } from 'drizzle-orm';
import { emailVerificationCodes, users } from '$lib/dbSchema';
import { isWithinExpirationDate } from 'oslo';
import { generateEmailVerificationCode, lucia } from '$lib/server/auth';
import { sendMail } from '$lib/mail';

export const load = (async (event) => {
	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/login');
	}

	if (user.emailVerified) {
		redirect(302, '/');
	}

	const code = await db.query.emailVerificationCodes
		.findFirst({
			where: and(
				eq(emailVerificationCodes.userId, user.id),
				gt(emailVerificationCodes.expiresAt, sql`unixepoch()`)
			)
		})
		.execute();

	if (!code) {
		return {
			error: 'No Code found'
		};
	}

	return {
		expiresAt: code.expiresAt,
		email: code.email
	};
}) satisfies PageServerLoad;

export const actions = {
	validate: async ({ cookies, request, locals }) => {
		const user = locals.user;
		if (!user) {
			return fail(401, { message: 'Must be connected' });
		}

		const formData = await request.formData();
		const code = formData.get('code');
		// check for length
		if (typeof code !== 'string' || code.length !== 5) {
			return fail(422, {
				message: 'Code invalid'
			});
		}

		const databaseCode = await db.query.emailVerificationCodes
			.findFirst({
				where: and(
					eq(emailVerificationCodes.userId, user.id),
					gt(emailVerificationCodes.expiresAt, sql`unixepoch()`)
				)
			})
			.execute();
		if (databaseCode) {
			await db
				.delete(emailVerificationCodes)
				.where(eq(emailVerificationCodes.id, databaseCode.id))
				.execute();
		}

		if (!databaseCode || databaseCode.code !== code) {
			return fail(400, {
				message: 'mauvais code'
			});
		}
		if (!isWithinExpirationDate(databaseCode.expiresAt)) {
			return fail(400, {
				message: 'Code expiré'
			});
		}

		if (!user || user.email !== databaseCode.email) {
			// Todo: update user with email from validation code?
		}

		await db.update(users).set({ emailVerified: true }).where(eq(users.id, user.id)).execute();
		await lucia.invalidateUserSessions(user.id);
		const session = await lucia.createSession(user.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		redirect(302, '/');
	},
	newcode: async ({ locals }) => {
		const user = locals.user;
		if (!user) {
			return fail(401, { message: 'user required' });
		}

		const verificationCode = await generateEmailVerificationCode(user.id, user.email);

		await sendMail(
			user.email,
			'Nouveau Compte',
			`Félicitations ${user.username}! Voici votre code: ${verificationCode}`,
			`Félicitations ${user.username} voici votre code: <div style='color:red'>${verificationCode}</div>`
		);
	}
};
