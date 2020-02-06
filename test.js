import path from 'path';
import t from 'libtap';
import fastify from 'fastify';
import fastifyBabel from 'fastify-babel';
import fastifyStatic from 'fastify-static';

import {grabImage, testBrowser} from './index.js';
import platformBin from './platform-bin.js';

global.__coverage__ = {};

const deadBrowser = () => {};
const babelrc = {plugins: ['babel-plugin-istanbul']};

function platformTest(testPlatform) {
	return async t => {
		const {platform} = process;
		Object.defineProperty(process, 'platform', {value: testPlatform});

		t.equal(platformBin('test-bin'), testPlatform === 'win32' ? 'test-bin.cmd' : 'test-bin');

		Object.defineProperty(process, 'platform', {value: platform});
	};
}

async function main() {
	const daemon = fastify();
	daemon
		.register(fastifyStatic, {root: path.resolve('htdocs')})
		.register(fastifyBabel, {babelrc});
	await daemon.listen(0);
	daemon.server.unref();
	const baseURL = `http://localhost:${daemon.server.address().port}/`;

	await t.rejects(testBrowser(t), TypeError);
	await testBrowser(t, deadBrowser, baseURL, {
		async 'page1.html'(t) {
			t.fail('should not get here');
		}
	});

	await t.test('after deadBrowser', async t => t.same(global.__coverage__, {}));

	let gotCoverage;
	const pages = {
		async 'page1.html'(t, selenium) {
			const title = await selenium.executeScript(() => document.title);
			t.equal(title, 'Page 1');
		},
		async 'page2.html'(t, selenium) {
			gotCoverage = await selenium.executeScript(() => window.__coverage__);
			t.type(gotCoverage, 'object');
			const element = await selenium.findElement({id: 'grab'});
			t.matchSnapshot(await grabImage(element));
		}
	};

	await testBrowser(t, 'chrome', baseURL, pages);
	t.test('after chrome', async t => {
		t.same(JSON.parse(JSON.stringify(global.__coverage__)), gotCoverage);
	});
	global.__coverage__ = {};

	await testBrowser(t, 'firefox', baseURL, pages);
	t.test('after firefox', async t => {
		t.same(JSON.parse(JSON.stringify(global.__coverage__)), gotCoverage);
	});

	t.test('platformBin for linux', platformTest('linux'));
	t.test('platformBin for mac', platformTest('mac'));
	t.test('platformBin for win32', platformTest('win32'));
}

main().catch(t.error);
