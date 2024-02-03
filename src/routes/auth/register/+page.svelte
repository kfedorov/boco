<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<form use:enhance method="POST">
	<label for="email">Courriel</label>
	<input type="email" name="email" />
	<label for="username">Nom d'utilisateur</label>
	<input type="text" name="username" />
	<label for="password">Password</label>
	<input type="password" name="password" />
	<button>Créer un compte</button>
</form>

ou

<a href="/auth/login">se connecter</a>
