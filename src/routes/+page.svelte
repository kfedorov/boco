<script lang="ts">
    import type { PageData } from './$types';
    import { invalidateAll } from '$app/navigation';

    export let data: PageData;

    async function logout(event: MouseEvent) {
        event.preventDefault();
        await fetch('/auth/logout');
        // this will cause the load function of this page to re-run, redirecting us.
        await invalidateAll();
    }
</script>

Mes collectifs:
<ul>
    {#each data.collectives as collective}
        <li><a href="/collectives/{collective.id}">{collective.name}</a></li>
    {/each}
</ul>

<a href="/collectives">Rejoindre un collectif</a>


<!-- Href is for no js . -->
<a data-sveltekit-preload-data="tap" on:click={logout} href="/auth/logout">Se déconnecter</a>
