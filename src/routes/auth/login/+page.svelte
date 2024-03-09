<script lang="ts">
    import { enhance } from '$app/forms';
</script>

<form use:enhance method="POST">
    <label for="email">Courriel</label>
    <input type="email" name="email" />
    <label for="password">Password</label>
    <input type="password" name="password" />
    <button>Connexion</button>
</form>

ou

<a href="/auth/register">Créer un compte</a>
