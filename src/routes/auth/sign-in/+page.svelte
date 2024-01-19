<script lang="ts">
	import { TabGroup, Tab } from '@skeletonlabs/skeleton';
	import SignIn from '$lib/components/sign-in.svelte';
	import SignUp from '$lib/components/sign-up.svelte';
	import { signin, signup } from '$paraglide/messages.js';
	export let data;

	let tabSet = 'signIn';
</script>

<TabGroup justify="justify-center">
	Allo monde!

	<Tab bind:group={tabSet} name="signInTab" value={'signIn'}>{signin()}</Tab>
	<Tab bind:group={tabSet} name="signUpTab" value={'signUp'}>{signup()}</Tab>
	<!-- Tab Panels --->
	<svelte:fragment slot="panel">
		{#if tabSet === 'signIn'}
			<SignIn {data} />
		{:else if tabSet === 'signUp'}
			<SignUp {data} />
		{/if}
	</svelte:fragment>
</TabGroup>
