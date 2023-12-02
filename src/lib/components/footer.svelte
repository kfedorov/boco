<script lang="ts">
	import { CONTACT_EMAIL } from '$lib/config/constants';
	import * as m from '$paraglide/messages';
</script>

<div class="flex flex-row justify-center m-8">
	<a href="mailto:{CONTACT_EMAIL}" class="px-4">{m.contact()}</a> |
	<a href="/privacy" class="px-4">{m.privacy()}</a> |
	<a href="/terms" class="px-4">{m.terms()}</a>
</div>
