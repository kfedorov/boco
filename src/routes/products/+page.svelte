<script lang="ts">
    import type { PageData } from './$types';
    import _ from 'underscore';

    export let data: PageData;
    type product = PageData['products'][number];
    type variant = product['variants'][number];

    let gradient =
        'linear-gradient(0deg, rgba(255,255,255,1) 10%, rgba(255,255,255,1) 20%, rgba(255,255,255,0.9) 5rem, rgba(255,255,255,0) 100%)';

    function formatCurrency(amount: number): string {
        return (amount / 10000).toFixed(2) + '$';
    }

    function rebate(variant: variant, product: product) {
        const highestPrice = _.max(
            product.variants
                .filter((v) => v.amountInG)
                .map((v) => v.pricePoints[0].price / v.amountInG)
        );
        return (
            (100 - (variant.pricePoints[0].price / variant.amountInG / highestPrice) * 100).toFixed(
                0
            ) + '%'
        );
    }
</script>

{#if data.page > 0}
    <a href="?page={data.page - 1}">Précédente</a>
{/if}
{#if data.page < 5}
    <a href="?page={data.page + 1}">Suivante</a>
{/if}
<div class="product-list">
    {#each data.products as product}
        <div
            class="product"
            style={product.imageUrl
                ? `background-image: ${gradient}, url(${product.imageUrl})`
                : `background-image: ${gradient}`}
        >
            <div class="product-name">
                <a href={product.permalink}>{product.name}</a>
            </div>
            {#if product.organic}
                <div class="bio">Bio</div>
            {/if}
            {#if !product.inStock}
                <div class="not-in-stock">Not In stock</div>
            {/if}
            <div class="variants">
                {#each product.variants as variant}
                    {@const rebateValue = rebate(variant, product)}
                    <div class="variant">
                        <div class="variant-name">
                            {variant.name}
                        </div>

                        {#if variant.amountInG}
                            <div class="variant-price-per-kg">
                                {formatCurrency(
                                    variant.pricePoints[0].price / (variant.amountInG / 1000)
                                )}/kg
                                {#if rebateValue !== '0%'}
                                    <span class="variant-rebate">({rebateValue})</span>
                                {/if}
                            </div>
                        {/if}

                        <div class="variant-price">
                            {#if variant.amountInG}{(variant.amountInG / 1000).toFixed(2)} kg
                            {:else}{formatCurrency(variant.pricePoints[0].price)}
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/each}
</div>

<style>
    .product-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
        grid-auto-flow: row dense;
        gap: 1rem;
        margin: 1rem;
    }

    .product {
        min-height: 7rem;
        background-size: cover;
        background-position-y: 70%;
        background-position-x: 7rem;
        background-repeat: no-repeat;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 0.5rem;
        border-radius: 0.5rem;
        box-shadow:
            0 1px 2px rgba(106, 106, 106, 0.61),
            0 2px 4px #cfd5d78a,
            0 8px 12px rgba(163, 163, 163, 0.13);
        padding: 1rem;
        font-family: system-ui;
    }

    .product:hover {
        box-shadow:
            0 1px 2px rgba(106, 106, 106, 0.8),
            0 2px 4px rgba(207, 213, 215, 0.7),
            0 8px 16px rgba(163, 163, 163, 0.5);
    }

    .product-name a {
        font-size: 1.5rem;
        font-weight: 500;
        color: black;
    }

    .variant-name {
        font-weight: bold;
    }

    .variants {
        display: grid;
        grid-template-columns: repeat(3, minmax(min-content, max-content));
        gap: 0.75rem;
    }
    .variant-rebate {
        font-size: 0.8rem;
        font-weight: normal;
    }

    @media (max-width: 400px) {
        .product-list {
            grid-template-columns: 1fr;
        }
        .variants {
            grid-template-columns: 1fr;
        }
    }
</style>
