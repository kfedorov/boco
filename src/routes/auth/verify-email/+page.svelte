<script lang="ts">
    import type { PageData } from './$types';
    import { enhance } from '$app/forms';

    export let data: PageData;
</script>

{#if data.error}
    Aucun code n'a été trouvé pour votre compte.
{:else}
    Un code a été envoyé à {data.email}. Vous avez jusqu'à {data.expiresAt}. Veuillez le valider
    ici.

    <form use:enhance method="POST" action="?/validate">
        <label for="code">Code</label>
        <input type="text" name="code" />
    </form>
{/if}

<form method="POST" action="?/newcode">
    <button type="submit"> Cliquez ici pour demander un nouveau code. </button>
</form>
