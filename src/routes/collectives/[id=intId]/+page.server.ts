import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { and, eq } from 'drizzle-orm';
import { CollectiveMembers, Collectives } from '$lib/dbSchema';
import { type Actions, error, redirect } from '@sveltejs/kit';
import { SqliteError } from 'better-sqlite3';

export const load = (async (event) => {
    const collective = await db.query.Collectives.findFirst({
        where: eq(Collectives.id, parseInt(event.params.id)),
        with: {
            members: {
                with: {
                    user: {
                        columns: {
                            id: true,
                            username: true
                        }
                    }
                }
            }
        }
    });

    if (!collective) {
        error(404, {
            message: 'Not found'
        });
    }

    return {
        collective,
        inCollective:
            event.locals.user &&
            collective.members.find((member) => member.user.id === event.locals.user?.id) !==
                undefined
    };
}) satisfies PageServerLoad;

export const actions = {
    join: async ({ locals, params }) => {
        if (!locals.user) {
            redirect(302, '/');
        }

        if (!params.id) {
            error(422, 'id required');
        }

        const collectiveId = parseInt(params.id);

        try {
            await db
                .insert(CollectiveMembers)
                .values({
                    userId: locals.user.id,
                    collectiveId: collectiveId,
                    role: 'member'
                })
                .execute();
        } catch (err) {
            if (err instanceof SqliteError && err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
                error(422, { message: 'Vous faites déjà partie de ce collectif' });
            }

            throw err;
        }
    },
    leave: async ({ locals, params }) => {
        if (!locals.user) {
            redirect(302, '/');
        }

        if (!params.id) {
            error(422, 'id required');
        }

        // Prevent leaving as Owner.

        const collectiveId = parseInt(params.id);

        await db
            .delete(CollectiveMembers)
            .where(
                and(
                    eq(CollectiveMembers.userId, locals.user.id),
                    eq(CollectiveMembers.collectiveId, collectiveId)
                )
            )
            .execute();
    }
} satisfies Actions;
