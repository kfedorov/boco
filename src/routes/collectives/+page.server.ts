import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { CollectiveMembers } from '$lib/dbSchema';
import { eq } from 'drizzle-orm';

export const load = (async (event) => {
    let collectives = await db.query.Collectives.findMany().execute();

    if (event.locals.user) {
        const myCollectives = await db
            .select({
                collectiveId: CollectiveMembers.collectiveId
            })
            .from(CollectiveMembers)
            .where(eq(CollectiveMembers.userId, event.locals.user.id))
            .execute();

        const myCollectiveSet = new Set(myCollectives.map((c) => c.collectiveId));

        collectives = collectives.map((c) => {
            return {
                ...c,
                inCollective: myCollectiveSet.has(c.id)
            };
        });
    }

    return {
        collectives
    };
}) satisfies PageServerLoad;
