import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { desc, eq } from 'drizzle-orm';
import { Products, ProductVariantPricePoints, ProductVariants } from '$lib/dbSchema';

export const load = (async (event) => {
    const pageParam = event.url.searchParams.get('page');
    const page = pageParam ? parseInt(pageParam) : 0;

    const products = await db.query.Products.findMany({
        with: {
            variants: {
                with: {
                    pricePoints: {
                        where: eq(ProductVariantPricePoints.current, true)
                    }
                },
                orderBy: [desc(ProductVariants.externalId)]
            }
        },
        orderBy: Products.id,
        limit: 100,
        offset: page * 100
    }).execute();

    return {
        products,
        page
    };
}) satisfies PageServerLoad;
