const puppeteer = require('puppeteer');
const sleep = async ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports({
    /**
 * This function is used for uploading the image to facebook.
 * @param {Object} data The data came from NASA api.
 */
    handleFBUpload: async (data) => {
        const browser = await puppeteer.launch({
            headless: true, args: [
                '--start-maximized',
                '--disable-notifications'
            ]
        });
        const page = await browser.newPage();
        await page.goto('https://www.facebook.com/login');
        await page.type('#email', process.env.FB_EMAIL);
        await page.type('#pass', process.env.FB_PASS);
        await page.click('#loginbutton');
        await page.waitForNavigation();
        await page.goto('https://m.facebook.com');
        const imageIcon = await page.$("[class='img sp_LdwxfpG67Bn sx_21d147']");
        await imageIcon.click();
        await page.waitForSelector('[type="file"]');
        const fileInput = await page.$('[type="file"]');
        await fileInput.uploadFile('./' + data.title + '.jpg');
        await page.waitForSelector('#uniqid_1');
        await page.type('#uniqid_1', `Title: ${data.title} \n\nExplaination: ${data.explanation} \n\n\n\nData collected from NASA and posted by MAD FALCON [bot]`);
        await sleep(3000);
        await page.evaluate(() => document.querySelector('[value="Post"]').click());
        page.on('dialog', async dialog => dialog.accept());
        await sleep(10000);
        await browser.close();
    }
});