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

Les utilisateurs:
<ul>
	{#each data.users as user}
		<li>{user.username}: {user.email}, {user.emailVerified}</li>
	{/each}
</ul>

<a href="/b">To B</a>

<!-- Href is for no js . -->
<a on:click={logout} href="/auth/logout">Se déconnecter</a>
