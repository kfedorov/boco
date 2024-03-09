import { Lucia } from 'lucia';
import { dev } from '$app/environment';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
import { db, sqliteDB } from '$lib/db';
import { EmailVerificationCodes } from '$lib/dbSchema';
import { eq } from 'drizzle-orm';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { createDate, TimeSpan } from 'oslo';

const adapter = new BetterSqlite3Adapter(sqliteDB, {
    user: 'user',
    session: 'session'
});

export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            // set to `true` when using HTTPS
            secure: !dev
        }
    },
    getUserAttributes(databaseUser) {
        return {
            username: databaseUser.user_name,
            email: databaseUser.email,
            emailVerified: !!databaseUser.email_verified
        };
    }
});

declare module 'lucia' {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: {
            email: string;
            user_name: string;
            email_verified: number;
        };
    }
}

export async function generateEmailVerificationCode(
    userId: string,
    email: string
): Promise<string> {
    await db
        .delete(EmailVerificationCodes)
        .where(eq(EmailVerificationCodes.userId, userId))
        .execute();
    const code = generateRandomString(5, alphabet('0-9'));
    await db.insert(EmailVerificationCodes).values({
        userId,
        email,
        code,
        expiresAt: createDate(new TimeSpan(10, 'm')) // 5 minutes
    });
    return code;
}
