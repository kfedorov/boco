<script lang="ts">
    import type { PageData } from './$types';

    export let data: PageData;
</script>

Collective: {data.collective.name}

{#if data.inCollective}
    <form method="POST" action="?/leave">
        <button>Quitter</button>
    </form>
{:else}
    <form method="POST" action="?/join">
        <button>Rejoindre</button>
    </form>
{/if}

<p>
    {data.collective.description}
</p>

<div>
    Membres
    <ul>
        {#each data.collective.members as member}
            <li>{member.user.username} ({member.role})</li>
        {/each}
    </ul>
</div>
