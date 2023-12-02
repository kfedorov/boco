import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { paraglide } from '@inlang/paraglide-js-adapter-vite';
import path from 'path';

export default defineConfig({
	plugins: [
		paraglide({
			project: './project.inlang', //Path to your inlang project
			outdir: './src/paraglide' //Where you want the generated files to be placed
		}),
		sveltekit()
	],
	resolve: {
		alias: {
			$paraglide: path.resolve(__dirname, 'src/paraglide')
		}
	}
});
