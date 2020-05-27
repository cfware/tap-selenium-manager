# @cfware/tap-selenium-manager [![NPM Version][npm-image]][npm-url]

Selenium Manager for tap

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
	if (await testBrowser(t, 'firefox', baseURL, pages)) {
		console.log('Firefox tests ran');
	}
	if (await testBrowser(t, 'chrome', baseURL, pages)) {
		console.log('Chrome tests ran');
	}
}

main().catch(t.error);
```


[npm-image]: https://img.shields.io/npm/v/@cfware/tap-selenium-manager.svg
[npm-url]: https://npmjs.org/package/@cfware/tap-selenium-manager
