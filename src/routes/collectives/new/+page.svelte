<script lang="ts">
    import type { PageData } from './$types';
    import { enhance } from '$app/forms';

    export let data: PageData;
</script>

<form use:enhance method="POST">
    <label for="name">Nom</label>
    <input id="name" type="text" name="name" />
    <label for="description">Description</label>
    <textarea id="description" name="description" />
    <button>Créer un collectif</button>
</form>
