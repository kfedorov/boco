import type { LayoutServerLoad } from './$types';

export const load = (async ({ setHeaders }) => {
	// When a page requires auth, ensure we not store it in the bfcache to avoid leaking sensitive
	// data after user logs out then a 'back' is clicked in the browser.
	// This header should only be set for sensitive pages.

	// This also is only for the no-js land. With js, route navigation happens on the frontend where
	// invalidateAll() should be called to force a re-load of data triggering navigations.
	setHeaders({ 'Cache-Control': 'no-store' });
}) satisfies LayoutServerLoad;
