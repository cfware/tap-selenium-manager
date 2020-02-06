import seleniumWebdriver from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import seleniumWebdriverIO from 'selenium-webdriver/io/index.js';
import platformBin from './platform-bin.js';

export default () => {
	return new seleniumWebdriver.Builder()
		.forBrowser('firefox')
		.setFirefoxOptions(new firefox.Options().headless())
		.setFirefoxService(new firefox.ServiceBuilder(
			seleniumWebdriverIO.findInPath(platformBin('geckodriver'))
		));
};
