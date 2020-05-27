import path from 'path';
import t from 'libtap';
import fastify from 'fastify';
import fastifyBabel from 'fastify-babel';
import fastifyStatic from 'fastify-static';

import {grabImage, testBrowser} from './index.js';
import platformBin from './platform-bin.js';

const selfCoverage = global.__coverage__;
global.__coverage__ = {};
delete process.env.NODE_OPTIONS;

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
	let tested = await testBrowser(t, deadBrowser, baseURL, {
		async 'page1.html'(t) {
			t.fail('should not get here');
		}
	});

	t.equal(tested, false);

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

	const standardTest = async browser => {
		tested = await testBrowser(t, browser, baseURL, pages);
		if (tested) {
			await t.test(`after ${browser}`, async t => {
				t.same(JSON.parse(JSON.stringify(global.__coverage__)), gotCoverage);
				t.ok(Object.keys(global.__coverage__).length);
			});

			global.__coverage__ = {};
		}
	};

	await standardTest('chrome');
	await standardTest('firefox');

	const simulateDaemon = {
		calls: {
			start: 0,
			stop: 0,
			url: 0
		},
		async start() {
			simulateDaemon.calls.start++;
		},
		async stop() {
			simulateDaemon.calls.stop++;
		},
		get baseURL() {
			simulateDaemon.calls.url++;
			return baseURL;
		}
	};
	tested = await testBrowser(t, 'firefox', simulateDaemon, {
		async 'page1.html'(t, selenium) {
			t.same(simulateDaemon.calls, {
				start: 1,
				stop: 0,
				url: 1
			});
			await pages['page1.html'](t, selenium);
		},
		async 'page2.html'(t, selenium) {
			t.same(simulateDaemon.calls, {
				start: 1,
				stop: 0,
				url: 1
			});
			await pages['page2.html'](t, selenium);
		}
	});
	if (tested) {
		await t.test('after firefox', async t => {
			t.same(simulateDaemon.calls, {
				start: 1,
				stop: 1,
				url: 1
			});
			t.same(JSON.parse(JSON.stringify(global.__coverage__)), gotCoverage);
			t.ok(Object.keys(global.__coverage__).length);
		});
	}

	t.test('platformBin for linux', platformTest('linux'));
	t.test('platformBin for mac', platformTest('mac'));
	t.test('platformBin for win32', platformTest('win32'));

	global.__coverage__ = selfCoverage;
}

main().catch(t.error);
