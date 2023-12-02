<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	//import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
	import { userSchema } from '$lib/config/zod-schemas';
	import { ConicGradient } from '@skeletonlabs/skeleton';
	import type { ConicStop } from '@skeletonlabs/skeleton';
	import { AlertTriangle } from 'lucide-svelte';
	export let data;

	const signUpSchema = userSchema.pick({
		name: true,
		email: true
	});

	const { form, errors, enhance, delayed, message } = superForm(data.form, {
		taintedMessage: null,
		validators: signUpSchema,
		delayMs: 0
	});

	const conicStops: ConicStop[] = [
		{ color: 'transparent', start: 0, end: 25 },
		{ color: 'rgb(var(--color-primary-900))', start: 75, end: 100 }
	];
</script>

<form method="POST" use:enhance>
	<!--<SuperDebug data={$form} />-->
	<h3>Profile</h3>
	<hr class="!border-t-2 mt-2 mb-6" />
	{#if $message}
		<aside class="alert variant-filled-success mt-6">
			<!-- Message -->
			<div class="alert-message">
				<p>{$message}</p>
			</div>
		</aside>
	{/if}
	{#if $errors._errors}
		<aside class="alert variant-filled-error mt-6">
			<!-- Icon -->
			<div><AlertTriangle size="42" /></div>
			<!-- Message -->
			<div class="alert-message">
				<h3 class="h3">Sign In Problem</h3>
				<p>{$errors._errors}</p>
			</div>
		</aside>
	{/if}
	<div class="mt-6">
		<label class="label">
			<span class="">First Name</span>
			<input
				id="name"
				name="name"
				type="text"
				placeholder="First Name"
				autocomplete="given-name"
				data-invalid={$errors.name}
				bind:value={$form.name}
				class="input"
				class:input-error={$errors.name}
			/>
			{#if $errors.name}
				<small>{$errors.name}</small>
			{/if}
		</label>
	</div>
	<div class="mt-6">
		<label class="label">
			<span class="">Email address</span>
			<input
				id="email"
				name="email"
				type="email"
				placeholder="Email address"
				autocomplete="email"
				data-invalid={$errors.email}
				bind:value={$form.email}
				class="input"
				class:input-error={$errors.email}
			/>
			{#if $errors.email}
				<small>{$errors.email}</small>
			{/if}
		</label>
	</div>
	<div class="mt-6">
		<a href="/auth/password/reset">Change Password</a>
	</div>

	<div class="mt-6">
		<button type="submit" class="btn variant-filled-primary w-full"
			>{#if $delayed}<ConicGradient stops={conicStops} spin width="w-6" />{:else}Update Profile{/if}</button
		>
	</div>
</form>
