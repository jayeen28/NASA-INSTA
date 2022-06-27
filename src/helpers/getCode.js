const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const sleep = async (ms) => new Promise((resolve) => setTimeout(() => resolve('hello'), ms));
const getCode = async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', "--disable-notifications"], headless: true });
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('https://mail.google.com', ["geolocation", "midi", "notifications", "camera", "microphone", "background-sync", "ambient-light-sensor", "accelerometer", "gyroscope", "magnetometer", "accessibility-events", "clipboard-read", "clipboard-write", "payment-handler", "idle-detection", "midi-sysex"
    ]);
    const page = await browser.newPage();
    try {
        page.on('dialog', async dialog => {
            console.log(dialog.message)
            await dialog.allow();
        })

        await page.goto('https://mail.google.com', { waitUntil: 'domcontentloaded' })
        const navigationPromise = await page.waitForNavigation();
        await navigationPromise
        await page.waitForSelector('input[type="email"]')
        await page.click('input[type="email"]')
        await navigationPromise
        await page.type('input[type="email"]', process.env.INSTA_USER)
        await page.waitForSelector('#identifierNext')
        await page.click('#identifierNext')
        await page.waitForSelector('input[type="password"]')
        await page.click('input[type="email"]')
        await sleep(3000)
        await page.type('input[type="password"]', process.env.PUPP_PASS)
        await page.waitForSelector('#passwordNext')
        await page.click('#passwordNext')

        //inbox page
        await page.waitForNavigation();
        await sleep(20000)
        const res = await page.evaluate(() => {
            const trs = document.getElementsByTagName('tbody')[6].getElementsByTagName('tr')
            for (let i = 0; i < trs.length; i++) {
                const mainText = trs[i].getElementsByTagName('td')[3].innerText.split('\n')[0]
                const middleText = trs[i].getElementsByTagName('td')[4].getElementsByTagName('span')[0].textContent;
                if ('Instagram'.includes(mainText) && 'Verify your account'.includes(middleText)) {
                    trs[i].click()
                    break;
                }
            }
            return '';
        })
        await page.waitForNavigation();
        await sleep(5000);
        const code = await page.evaluate(() => document.getElementsByTagName('font')[0].textContent)
        await browser.close();
        return code;
    }
    catch (err) {
        await browser.close()
        await sleep(20000)
        getCode();
    }

}

module.exports = getCode;