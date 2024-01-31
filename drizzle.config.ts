import type { Config } from 'drizzle-kit';
export default {
	schema: './src/lib/dbSchema.ts',
	out: './drizzle',
} satisfies Config;