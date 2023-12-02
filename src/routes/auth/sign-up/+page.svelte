<script lang="ts">
	import { TabGroup, Tab } from '@skeletonlabs/skeleton';
	import SignUp from '$lib/components/sign-up.svelte';
	import SignIn from '$lib/components/sign-in.svelte';
	import * as m from '$paraglide/messages';
	export let data;

	//let tab: string = $page.params.tab;
	//let tabSet: string = tab === 'sign-up' ? 'signUp' : 'signIn';
	let tabSet = 'signUp';
</script>

<TabGroup justify="justify-center">
	<Tab bind:group={tabSet} name="signInTab" value={'signIn'}>{m.signin()}</Tab>
	<Tab bind:group={tabSet} name="signUpTab" value={'signUp'}>{m.signup()}</Tab>
	<!-- Tab Panels --->
	<svelte:fragment slot="panel">
		{#if tabSet === 'signIn'}
			<SignIn {data} />
		{:else if tabSet === 'signUp'}
			<SignUp {data} />
		{/if}
	</svelte:fragment>
</TabGroup>
