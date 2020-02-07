import libCoverage from 'istanbul-lib-coverage';
import pngjs from 'pngjs';

import builderFirefox from './builder-firefox.js';
import builderChrome from './builder-chrome.js';

const png = pngjs.PNG.sync;

async function build(builder) {
	try {
		const selenium = await builder().build();

		/* Verify the browser can start */
		await selenium.get('data:text/plain,');

		return selenium;
	} catch {
	}
}

export async function grabImage(element) {
	const image64 = await element.takeScreenshot();
	return png.write(png.read(Buffer.from(image64, 'base64')));
}

async function getBaseURL(daemon) {
	if (typeof daemon === 'string') {
		return daemon;
	}

	await daemon.start();
	return daemon.baseURL;
}

async function stopDaemon(daemon) {
	if (typeof daemon === 'string') {
		return;
	}

	await daemon.stop();
}

export async function testBrowser(t, browser, daemon, pages) {
	let builder;
	let foundCoverage = false;
	const coverageMap = libCoverage.createCoverageMap();

	switch (browser) {
		case 'chrome':
			builder = builderChrome;
			break;
		case 'firefox':
			builder = builderFirefox;
			break;
		default:
			if (typeof browser !== 'function') {
				throw new TypeError(`Unknown browser: ${browser}`);
			}

			builder = browser;
			browser = builder.name;
	}

	const selenium = await build(builder);
	if (!selenium) {
		t.test(browser, {skip: true}, () => {});
		return;
	}

	const baseURL = await getBaseURL(daemon);
	await t.test(browser, {buffered: false}, async t => {
		for (const [page, implementation] of Object.entries(pages)) {
			t.test(page, {buffered: false}, async t => {
				await selenium.get(`${baseURL}${page}`);
				await implementation(t, selenium);

				if (coverageMap) {
					const coverage = await selenium.executeScript(
						/* istanbul ignore next */
						() => window.__coverage__
					);

					if (coverage) {
						foundCoverage = true;
						/* Merge coverage object from the browser running this test. */
						coverageMap.merge(coverage);
					}
				}
			});
		}
	});

	await selenium.quit();
	await stopDaemon(daemon);

	if (foundCoverage) {
		if (global.__coverage__) {
			coverageMap.merge(global.__coverage__);
		}

		global.__coverage__ = coverageMap.toJSON();
	}
}
