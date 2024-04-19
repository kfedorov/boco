import { db } from '$lib/db';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { CollectiveMembers, Collectives } from '$lib/dbSchema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, locals }) => {
    if (!locals.user) {
        // TODO: new issue: redirect on back without javascript removes a history entry, but with
        // js, it actually keeps the status quo, holding the user hostage.
        return redirect(302, '/auth/login');
    }
    const collectives = await db
        .select({
            id: Collectives.id,
            name: Collectives.name
        })
        .from(Collectives)
        .innerJoin(CollectiveMembers, eq(Collectives.id, CollectiveMembers.collectiveId))
        .where(eq(CollectiveMembers.userId, locals.user.id))
        .execute();

    return {
        collectives
    };
};
