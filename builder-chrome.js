import seleniumWebdriver from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import seleniumWebdriverIO from 'selenium-webdriver/io/index.js';
import platformBin from './platform-bin.js';

export default () => {
    return new seleniumWebdriver.Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options().headless())
        .setChromeService(new chrome.ServiceBuilder(
            seleniumWebdriverIO.findInPath(platformBin('chromedriver'))
        ));
};
