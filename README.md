# @cfware/tap-selenium-manager

[![Travis CI][travis-image]][travis-url]
[![Greenkeeper badge][gk-image]](https://greenkeeper.io/)
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![MIT][license-image]](LICENSE)

Selenium Manager for tap

### Install @cfware/tap-selenium-manager

This module requires node.js 13.7.0 or above.

```sh
npm install @cfware/tap-selenium-manager
```

## Usage

```js
import {testBrowser, grabImage} from '@cfware/tap-selenium-manager';
import t from 'libtap';

import startHTTPD from './your-httpd-server.js';

const pages = {
	async 'page1.html'(t, selenium) {
		// Use `selenium` to control the browser and `t` to perform
		// assertions on the results.
		const element = await selenium.findElement({id: 'image'});
		t.matchSnapshot(await grabImage(element));
	}
};

async function main() {
	const baseURL = await startHTTPD();
	await testBrowser(t, 'firefox', baseURL, pages);
	await testBrowser(t, 'chrome', baseURL, pages);
}

main().catch(t.error);
```


[npm-image]: https://img.shields.io/npm/v/@cfware/tap-selenium-manager.svg
[npm-url]: https://npmjs.org/package/@cfware/tap-selenium-manager
[travis-image]: https://travis-ci.org/cfware/tap-selenium-manager.svg?branch=master
[travis-url]: https://travis-ci.org/cfware/tap-selenium-manager
[gk-image]: https://badges.greenkeeper.io/cfware/tap-selenium-manager.svg
[downloads-image]: https://img.shields.io/npm/dm/@cfware/tap-selenium-manager.svg
[downloads-url]: https://npmjs.org/package/@cfware/tap-selenium-manager
[license-image]: https://img.shields.io/npm/l/@cfware/tap-selenium-manager.svg
