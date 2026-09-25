import { defineConfig } from '@vscode/test-cli';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	files: 'out/test/host/**/*.test.js',
	version: '1.110.0',
	launchArgs: [
		`--user-data-dir=${fileURLToPath(new URL('.vscode-test/u', import.meta.url))}`,
		`--extensions-dir=${fileURLToPath(new URL('.vscode-test/e', import.meta.url))}`,
		'--disable-extensions',
		'--skip-welcome',
		'--skip-release-notes',
	],
});
