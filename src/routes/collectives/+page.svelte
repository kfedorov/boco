<script lang="ts">
    import type { PageData } from './$types';
    import { enhance } from '$app/forms';

    export let data: PageData;
</script>

<div class="collectives">
    {#each data.collectives as collective}
        <div class="collective">
            <a href="/collectives/{collective.id}">{collective.name}</a>
            <div>{collective.description}</div>

            {#if collective.inCollective}
                <form method="POST" use:enhance action="/collectives/{collective.id}?/leave">
                    <button>Quitter</button>
                </form>
            {:else}
                <form method="POST" use:enhance action="/collectives/{collective.id}?/join">
                    <button>Rejoindre</button>
                </form>
            {/if}
        </div>
    {/each}

    <a href="/collectives/new" class="collective"> Créer un collectif. </a>
</div>

<style>
    .collectives {
        display: grid;
        grid-template-columns: minmax(min-content, 20rem);
        gap: 1rem;
    }

    .collective {
        display: block;
        padding: 1rem;
        text-decoration: none;
        border-radius: 0.5rem;
        border: 1px solid var(--border-color, rgba(0, 0, 0, 0.2));
    }
</style>
