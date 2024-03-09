import { db } from '$lib/db';
import { Products, ProductVariantPricePoints, ProductVariants } from '$lib/dbSchema';
import { desc, eq, inArray, type InferInsertModel, type InferSelectModel, sql } from 'drizzle-orm';
import { RateLimiter } from 'limiter-es6-compat';

import cliProgress from 'cli-progress';

import _ from 'underscore';
import { parse } from 'node-html-parser';

const vracTag = 1765;

// 25 requests per 10 s
let limiter = new RateLimiter({ tokensPerInterval: 2, interval: 1000 });

type progressTracker = {
    productCount: number;
    variantCount: number;
    fetchedProducts: number;
    fetchedVariants: number;
    savedProducts: number;
    createdVariants: number;
    updatedVariants: number;
    deactivatedVariants: number;
    productFailed: [];
    variantFailed: [];
    finished: boolean;
};

type wooCommerceProduct = {
    id: number;
    name: string;
    prices: {
        price: string;
        currency_minor_unit: number;
    };
    variation: string;
    variations: {
        id: number;
        attributes: { name: string; value: string }[];
    }[];
    description: string;
    permalink: string;
    tags: { id: number; name: string; slug: string; link: string }[] | null;
    images: { id: number; src: string }[] | null;
    sku: string;
    is_in_stock: boolean;
};

export async function importMerciProducts(
    maxPageSize: number = 100,
    maxPages: number = Number.MAX_SAFE_INTEGER,
    rateLimiter: RateLimiter | null = null
) {
    if (rateLimiter) {
        limiter = rateLimiter;
    }

    const merciUrl = new URL('https://alimentsmerci.com/wp-json/wc/store/products');
    merciUrl.searchParams.append('tag', String(vracTag));
    merciUrl.searchParams.append('type', 'variable');

    const tracker: progressTracker = {
        productCount: 0,
        variantCount: 0,
        fetchedProducts: 0,
        fetchedVariants: 0,
        savedProducts: 0,
        createdVariants: 0,
        deactivatedVariants: 0,
        updatedVariants: 0,
        productFailed: [],
        variantFailed: [],
        finished: false
    };

    const bar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: '{bar} | {eta_formatted} | {value} / {total} {action}'
    });

    const fetchedProductsBar = bar.create(
        0,
        0,
        { action: 'fetched products' },
        cliProgress.Presets.shades_grey
    );
    const savedProductsBar = bar.create(
        0,
        0,
        { action: 'saved products' },
        cliProgress.Presets.shades_grey
    );

    const fetchedVariantsBar = bar.create(
        0,
        0,
        { action: 'fetched variants' },
        cliProgress.Presets.shades_grey
    );
    const savedVariantsBar = bar.create(
        0,
        0,
        { action: 'saved variants' },
        cliProgress.Presets.shades_grey
    );

    pollUpdateProgress(tracker, {
        fetchedProductsBar,
        fetchedVariantsBar,
        savedProductsBar,
        savedVariantsBar
    });

    await importAllPages(merciUrl, tracker, maxPageSize, maxPages).finally(
        () => (tracker.finished = true)
    );

    bar.stop();

    console.log('Finished.');

    return tracker;
}

type Bars = {
    fetchedProductsBar: cliProgress.SingleBar;
    savedProductsBar: cliProgress.SingleBar;
    fetchedVariantsBar: cliProgress.SingleBar;
    savedVariantsBar: cliProgress.SingleBar;
};

function pollUpdateProgress(tracker: progressTracker, bars: Bars) {
    bars.fetchedProductsBar.setTotal(tracker.productCount);
    bars.savedProductsBar.setTotal(tracker.productCount);

    const variantCount = Math.max(tracker.variantCount, tracker.productCount);
    bars.fetchedVariantsBar.setTotal(variantCount);
    bars.savedVariantsBar.setTotal(variantCount);

    bars.fetchedVariantsBar.update(tracker.fetchedVariants);
    bars.fetchedProductsBar.update(tracker.fetchedProducts);
    bars.savedVariantsBar.update(
        tracker.createdVariants + tracker.updatedVariants + tracker.deactivatedVariants
    );
    bars.savedProductsBar.update(tracker.savedProducts);

    if (!tracker.finished) {
        setTimeout(() => pollUpdateProgress(tracker, bars), 100);
    }
}

async function importAllPages(
    endpoint: URL,
    tracker: progressTracker,
    pageSize: number,
    maxPages: number
) {
    endpoint.searchParams.set('orderby', 'id');
    endpoint.searchParams.set('order', 'asc');
    const firstResponse = await fetchPaginated(endpoint, 1, pageSize);
    const pageResponses: Promise<Response>[] = [new Promise((resolve) => resolve(firstResponse))];

    const paginationHeader = firstResponse.headers.get('X-WP-TotalPages');
    const countHeader = firstResponse.headers.get('X-WP-Total');
    if (paginationHeader) {
        const pageCount = Math.min(parseInt(paginationHeader), maxPages);
        for (let page = 2; page <= pageCount; page++) {
            pageResponses.push(fetchPaginated(endpoint, page, pageSize));
        }
    }

    if (countHeader) {
        tracker.productCount = parseInt(countHeader);
    }

    return Promise.all(
        pageResponses.map((p) =>
            p
                .then(async (response) => {
                    if (response.status !== 200) {
                        console.log(
                            'Error: status ' + response.status + ' fore request ' + response.url
                        );
                    }
                    const data = await response.json();

                    if (!Array.isArray(data)) {
                        console.log(
                            `Error: expected array of products returned from ${response.url}`
                        );
                        return [];
                    }

                    // Todo validate format of input
                    tracker.fetchedProducts += data.length;

                    return data;
                })
                .then((page) => importPage(page, tracker))
        )
    );
}

async function importPage(products: wooCommerceProduct[], tracker: progressTracker) {
    const tasks = [];
    // can we do this sooner?
    tracker.variantCount += products.map((p) => p.variations.length).reduce((a, sum) => a + sum, 0);
    const savedProducts = await saveProducts(products);
    tracker.savedProducts += savedProducts.length;

    for (const product of savedProducts) {
        tasks.push(
            fetchVariation(product)
                .then(async (response) => {
                    if (response.status !== 200) {
                        console.log(
                            'Error: status ' + response.status + ' fore request ' + response.url
                        );
                    }
                    const data = await response.json();
                    if (!Array.isArray(data)) {
                        console.log(
                            `Error: expected array of products returned from ${response.url}`
                        );
                        return [];
                    }
                    // Todo validate format of input
                    tracker.fetchedVariants += data.length;
                    return data;
                })
                .catch((e) => console.log(e))
                .then((variations) => {
                    if (variations) {
                        saveVariations(product, variations, tracker);
                    }
                })
        );
    }
    await Promise.all(tasks);
}

async function fetchVariation(product: InferSelectModel<typeof Products>): Promise<Response> {
    const merciUrl = new URL('https://alimentsmerci.com/wp-json/wc/store/products');
    merciUrl.searchParams.append('parent', String(product.externalId));
    merciUrl.searchParams.append('type', 'variation');

    return await limitAndFetch(merciUrl);
}

async function saveProducts(products: wooCommerceProduct[]) {
    if (products.length < 1) {
        return [];
    }

    return db
        .insert(Products)
        .values(products.map(productToDb))
        .onConflictDoUpdate({
            target: [Products.externalId, Products.provider],
            set: {
                name: sql`excluded.name`,
                permalink: sql`excluded.permalink`,
                imageUrl: sql`excluded.image_url`,
                externalSKU: sql`excluded.external_SKU`,
                origin: sql`excluded.origin`,
                organic: sql`excluded.organic`,
                inStock: sql`excluded.in_stock`
            }
        })
        .returning()
        .execute();
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// todo: parse product categories
function productToDb(product: wooCommerceProduct): InferInsertModel<typeof Products> {
    let name = capitalize(product.name.trim());
    const originMatch = /(.*)(\([^)]*\))$/.exec(name);
    let origin = null;

    if (originMatch && originMatch.length > 2) {
        name = originMatch[1];
        origin = capitalize(originMatch[2].slice(1, -1)); // remove parentheses
    }

    name = name
        .replaceAll(/\bcaisse\b/g, '')
        .replaceAll(/\bbio(logique)?\b/g, '')
        .replaceAll(/\borganic\b/g, '')
        .replaceAll(/\s+/g, ' ')
        .trim();

    name = parse(name).textContent;

    return {
        name,
        origin,
        provider: 'merci',
        externalId: String(product.id),
        permalink: product.permalink,
        externalSKU: product.sku,
        inStock: product.is_in_stock,
        organic: !!(product.tags || []).find((t: { id: number }) => t.id === 1766),
        imageUrl: product.images && product.images.length ? product.images[0].src : null
    };
}

async function saveVariations(
    product: InferSelectModel<typeof Products>,
    merciVariations: wooCommerceProduct[],
    tracker: progressTracker
) {
    const existingVariants = await db.query.ProductVariants.findMany({
        where: eq(ProductVariants.productId, product.id),
        with: {
            pricePoints: {
                orderBy: [desc(ProductVariantPricePoints.verifiedAt)],
                limit: 1
            }
        }
    }).execute();

    const variantsToDeactivate = [];
    let variationsToAdd = [...merciVariations];
    for (const existingVariant of existingVariants) {
        const matchingVariation = merciVariations.find(
            (v) => String(v.id) === existingVariant.externalId
        );

        if (matchingVariation) {
            const { pricePoints, ...updatedVariant } = {
                ...existingVariant,
                ...variationToVariant(matchingVariation, product.id)
            };

            if (!_.isEqual(updatedVariant, existingVariant)) {
                await db
                    .update(ProductVariants)
                    .set(updatedVariant)
                    .where(eq(ProductVariants.id, updatedVariant.id))
                    .execute();
            }

            const newPrice = extractPrice(matchingVariation);

            if (pricePoints.length > 0 && pricePoints[0].price === newPrice) {
                // update latest price  and verified at now.
                await db
                    .update(ProductVariantPricePoints)
                    .set({
                        verifiedAt: new Date()
                    })
                    .where(eq(ProductVariantPricePoints.id, pricePoints[0].id))
                    .execute();
            } else {
                if (pricePoints.length > 0) {
                    await db
                        .update(ProductVariantPricePoints)
                        .set({
                            current: false
                        })
                        .execute();
                }
                await db
                    .insert(ProductVariantPricePoints)
                    .values({
                        current: true,
                        price: newPrice,
                        productVariantId: updatedVariant.id
                    })
                    .execute();
            }

            tracker.updatedVariants += 1;

            // Remove variation that has a matching variant
            variationsToAdd = variationsToAdd.filter(
                (v) => String(v.id) !== existingVariant.externalId
            );
        } else {
            if (existingVariant.current) {
                variantsToDeactivate.push(existingVariant.id);
            }
        }
    }

    if (variantsToDeactivate.length > 0) {
        await db
            .update(ProductVariants)
            .set({
                current: false
            })
            .where(inArray(ProductVariants.id, variantsToDeactivate))
            .execute();

        tracker.deactivatedVariants += variantsToDeactivate.length;
    }

    for (const variationToAdd of variationsToAdd) {
        const newVariant = await db
            .insert(ProductVariants)
            .values(variationToVariant(variationToAdd, product.id))
            .returning()
            .execute();

        await db
            .insert(ProductVariantPricePoints)
            .values({
                current: true,
                price: extractPrice(variationToAdd),
                productVariantId: newVariant[0].id
            })
            .execute();
        tracker.createdVariants += 1;
    }
}

function variationToVariant(
    merciVariation: wooCommerceProduct,
    productId: number
): InferInsertModel<typeof ProductVariants> {
    const amountText = extractWeightText(merciVariation);
    const name = extractVariationName(merciVariation);
    const variantData = {
        productId,
        externalId: String(merciVariation.id),
        amountInG: 0, // TODO: make this nullable!
        amountText,
        name
    };

    const amountInG = extractWeight(amountText, name);
    if (amountInG) {
        variantData.amountInG = amountInG;
    }

    return variantData;
}

function extractVariationName(variation: wooCommerceProduct): string {
    return variation.variation.replace('Type:', '').trim();
}

function extractWeightText(variation: wooCommerceProduct): string {
    const text = /<p>\s*(.*)<\/p>\s*/.exec(variation.description.trim());

    return text && text.length > 1 ? text[1] : '';
}

function extractWeight(weightText: string, name: string): number | null {
    const formattedText = weightText.toLowerCase().replaceAll(',', '.');
    const parseResult = /([\d.]+)?\s*(?:x\s*)?([\d.]+)?(\D+)/.exec(formattedText);
    if (!parseResult || parseResult.length === 0) {
        if (name.toLowerCase() === 'kg') {
            return 1000;
        }

        return null;
    }
    const [, multiplierText, formatText, unit] = parseResult;

    let multiplier = 1;
    if (multiplierText) {
        multiplier = parseFloat(multiplierText);
    }

    let format = 1;
    if (formatText) {
        format = parseFloat(formatText);
    }

    let unitMultipler = 1;
    switch (unit) {
        case 'kg': {
            unitMultipler = 1000;
            break;
        }
        case 'g': {
            unitMultipler = 1;
            break;
        }
        case 'lb': {
            unitMultipler = 453.592;
            break;
        }
    }

    return unitMultipler * format * multiplier;
}

function extractPrice(variation: wooCommerceProduct): number {
    return parseInt(variation.prices.price) * 10 ** (4 - variation.prices.currency_minor_unit);
}

async function fetchPaginated(endpoint: URL, pageNumber: number, pageSize: number) {
    endpoint.searchParams.set('page', String(pageNumber));
    endpoint.searchParams.set('per_page', String(pageSize));
    // Duplicate the URL to avoid it being mutated by another, since its passed as a reference
    return limitAndFetch(new URL(endpoint.href));
}

async function limitAndFetch(endpoint: URL, fetchParams: RequestInit = {}) {
    await limiter.removeTokens(1);
    return fetch(endpoint, fetchParams);
}
