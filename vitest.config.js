import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';

export default defineConfig({
	test: {
		browser: {
			enabled: true,
			headless: true,
			provider: playwright(),
			instances: [{browser: 'chromium'}],
			viewport: {width: 800, height: 600}
		}
	}
});
