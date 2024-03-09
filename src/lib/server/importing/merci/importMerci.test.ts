import { expect, test, vi } from 'vitest';
import productList from './samples/productList.json';
import product from './samples/product.json';
import { importMerciProducts } from './importMerci';
import { RateLimiter } from 'limiter-es6-compat';

function createFetchResponse(data: object, headers: HeadersInit = {}) {
    return {
        json: () => new Promise((resolve) => resolve(data)),
        headers: new Headers(headers),
        status: 200
    };
}

let variantId = 0;
function createVariantFetchResponse(count: number = 3) {
    return createFetchResponse(
        new Array(count).fill(product).map((p) => ({ ...p, id: variantId++ }))
    );
}

test('Can import merci', async () => {
    expect(import.meta.env.MODE).toEqual('test');

    global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createFetchResponse(productList, [['x-wp-totalpages', '1']]))
        .mockResolvedValue(createVariantFetchResponse(3));

    const { savedProducts, createdVariants } = await importMerciProducts(
        100,
        1000,
        new RateLimiter({ tokensPerInterval: 1000, interval: 'sec' })
    );

    expect(savedProducts).toEqual(10);
    expect(createdVariants).toEqual(30);
    expect(global.fetch).toHaveBeenCalledTimes(11);
});
