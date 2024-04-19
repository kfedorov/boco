import type { PageServerLoad } from './$types';
import { type Actions, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { CollectiveMembers, Collectives } from '$lib/dbSchema';

export const load = (async (event) => {
    if (!event.locals.user) {
        redirect(302, '/');
    }
}) satisfies PageServerLoad;

export const actions = {
    default: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(403, { message: 'Unauthenticated' });
        }

        const formData = await request.formData();
        const name = formData.get('name');
        const description = formData.get('description');

        if (!name || typeof name !== 'string' || !description || typeof description !== 'string') {
            return fail(422, { message: 'invalid input' });
        }

        const newCollective = await db
            .insert(Collectives)
            .values({
                name,
                description
            })
            .returning();

        if (!newCollective || newCollective.length < 1) {
            return fail(500, { message: 'Failed creating collective' });
        }

        await db
            .insert(CollectiveMembers)
            .values({
                userId: locals.user.id,
                collectiveId: newCollective[0].id,
                role: 'owner'
            })
            .execute();

        redirect(303, `/collectives/${newCollective[0].id}`);
    }
} satisfies Actions;
