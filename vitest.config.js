import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';

// chromium, firefox or webkit
const browser = process.env.TEST_BROWSER || 'chromium';

export default defineConfig({
	test: {
		browser: {
			enabled: true,
			headless: true,
			// Firefox only exposes touch events with touch enabled
			provider: playwright({contextOptions: {hasTouch: true}}),
			instances: [{browser}],
			viewport: {width: 800, height: 600}
		}
	}
});
