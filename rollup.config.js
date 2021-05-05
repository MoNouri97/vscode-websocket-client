import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import fs from 'fs';
import path from 'path';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';

// const production = true;
const production = !process.env.ROLLUP_WATCH;
console.log({ production });

export default fs
	.readdirSync(path.join(__dirname, 'web-views', 'pages'))
	.map(input => {
		const name = input.split('.')[0];
		return {
			input: 'web-views/pages/' + input,

			output: {
				sourcemap: true,
				format: 'iife',
				name: 'app',
				file: 'out/compiled/' + name + '.js',
			},
			moduleContext: id => {
				// In order to match native module behaviour, Rollup sets `this`
				// as `undefined` at the top level of modules. Rollup also outputs
				// a warning if a module tries to access `this` at the top level.
				// The following modules use `this` at the top level and expect it
				// to be the global `window` object, so we tell Rollup to set
				// `this = window` for these modules.
				const thisAsWindowForModules = [
					'node_modules/@stomp/stompjs/esm6/client.js',
				];

				if (thisAsWindowForModules.some(id_ => id.trimRight().endsWith(id_))) {
					return 'window';
				}
			},
			plugins: [
				replace({
					preventAssignment: true,
					'process.env.NODE_ENV': JSON.stringify('production'),
				}),
				svelte({
					// enable run-time checks when not in production
					dev: !production,
					// we'll extract any component CSS out into
					// a separate file - better for performance
					css: css => {
						css.write(name + '.css');
					},
					preprocess: sveltePreprocess(),
				}),

				// If you have external dependencies installed from
				// npm, you'll most likely need these plugins. In
				// some cases you'll need additional configuration -
				// consult the documentation for details:
				// https://github.com/rollup/plugins/tree/master/packages/commonjs
				resolve({
					browser: true,
					dedupe: ['svelte'],
				}),
				commonjs(),
				typescript({
					tsconfig: 'web-views/tsconfig.json',
					sourceMap: !production,
					inlineSources: !production,
				}),

				// In dev mode, call `npm run start` once
				// the bundle has been generated
				// !production && serve(),

				// Watch the `public` directory and refresh the
				// browser on changes when not in production
				// !production && livereload("public"),

				// If we're building for production (npm run build
				// instead of npm run dev), minify
				production && terser(),
			],
			watch: {
				clearScreen: false,
			},
		};
	});
