const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const notifier = require('./notifier');

// Use the StealthPlugin to enhance Puppeteer for stealthy browsing
puppeteer.use(StealthPlugin());

// Define a custom sleep function to pause execution for a specified duration
const sleep = async (ms) => new Promise((resolve) => setTimeout(() => resolve('hello'), ms));

// Define a function to retrieve a verification code from a Gmail inbox
const getCode = async () => {
    // Launch a headless Chromium browser using Puppeteer
    const browser = await puppeteer.launch({ args: ['--no-sandbox', "--disable-notifications"], headless: true });

    // Create a browser context and override permissions for specific features
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('https://mail.google.com', [
        "geolocation", "midi", "notifications", "camera", "microphone", "background-sync",
        "ambient-light-sensor", "accelerometer", "gyroscope", "magnetometer", "accessibility-events",
        "clipboard-read", "clipboard-write", "payment-handler", "idle-detection", "midi-sysex"
    ]);

    // Create a new browser page
    const page = await browser.newPage();

    try {
        // Handle browser dialog boxes (e.g., alerts) and allow them
        page.on('dialog', async dialog => {
            notifier({ message: dialog.message, notify: false });
            await dialog.allow();
        });

        // Navigate to the Gmail login page
        await page.goto('https://mail.google.com', { waitUntil: 'domcontentloaded' });

        // Wait for navigation to complete
        const navigationPromise = await page.waitForNavigation();
        await navigationPromise;

        // Wait for the email input field to load and input the Instagram username
        await page.waitForSelector('input[type="email"]');
        await page.click('input[type="email"]');
        await navigationPromise;
        await page.type('input[type="email"]', process.env.INSTA_USER);

        // Wait for the "Next" button and click it
        await page.waitForSelector('#identifierNext');
        await page.click('#identifierNext');

        // Wait for the password input field to load, input the Gmail password, and click "Next"
        await page.waitForSelector('input[type="password"]');
        await page.click('input[type="email"]');
        await sleep(3000);
        await page.type('input[type="password"]', process.env.GOOGLE_PASS);
        await page.waitForSelector('#passwordNext');
        await page.click('#passwordNext');

        // Wait for the inbox page to load
        await page.waitForNavigation();
        await sleep(20000);

        // Interact with the Gmail inbox to locate the Instagram verification email
        await page.evaluate(() => {
            const trs = document.getElementsByTagName('tbody')[6].getElementsByTagName('tr');
            for (let i = 0; i < trs.length; i++) {
                const mainText = trs[i].getElementsByTagName('td')[3].innerText.split('\n')[0];
                const middleText = trs[i].getElementsByTagName('td')[4].getElementsByTagName('span')[0].textContent;
                if ('Instagram'.includes(mainText) && 'Verify your account'.includes(middleText)) {
                    trs[i].click(); // Click on the email if it matches the criteria
                    break;
                }
            }
            return '';
        });

        // Wait for the email to open and load
        await page.waitForNavigation();
        await sleep(5000);

        // Extract the verification code from the email
        const code = await page.evaluate(() => document.getElementsByTagName('font')[0].textContent);

        // Close the browser
        await browser.close();

        // Return the extracted verification code
        return code;
    } catch (err) {
        // Handle errors by closing the browser, waiting, and then retrying
        await browser.close();
        await sleep(20000);
        getCode();
    }
}

// Export the getCode function for external use
module.exports = getCode;
