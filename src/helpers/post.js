const fs = require('fs');
const Instagram = require('instagram-web-api');
const FileCookieStore = require('tough-cookie-filestore2');
const getCode = require('./getCode');
const path = require('path');
const notifier = require('./notifier');
const cookieStore = new FileCookieStore(path.join(global.projectLocation, 'cookies.json'));
const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve(''), ms));
const { INSTA_USER, INSTA_PASS } = process.env;

/**
 * Login to an Instagram account using the provided client.
 *
 * @param {Instagram} client - Instagram API client.
 * @returns {boolean} - Indicates whether the login was successful.
 */
const clientLogin = async (client) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Attempt to login to the Instagram account
            const res = await client.login({}, { _sharedData: false });

            // If authentication is successful, resolve with the result
            if (res.authenticated) resolve(true);
        } catch (err) {
            notifier({ message: err, notify: false });
            try {
                if (err.error?.message === 'checkpoint_required') {
                    // Handle the case where a verification code is required
                    const challengeUrl = err.error.checkpoint_url;
                    const res = await client.updateChallenge({ challengeUrl, choice: 1 });
                    if (res.challengeType === 'VerifyEmailCodeForm') {
                        await sleep(10000);
                        const code = await getCode();
                        const { navigation: { forward } } = res;
                        if (code) {
                            const res = await client.updateChallenge({ challengeUrl: `${forward}`, choice: 0, securityCode: code });
                            notifier({ message: res, notify: false });
                            if (res.status === 'ok') resolve(true);
                        }
                    } else {
                        notifier({ message: res, notify: false });
                        resolve(true);
                    }
                }
            } catch (err) {
                notifier({ message: err, notify: false });
                // if instagram send verification code then take code from mail.
                if (err.error?.challenge?.challengeType === 'VerifyEmailCodeForm') {
                    await sleep(10000);
                    const code = await getCode();
                    const { options: { uri } } = err;
                    if (code) {
                        const res = await client.updateChallenge({ challengeUrl: `${uri}`, choice: 0, securityCode: code });
                        if (res.status === 'ok') resolve(true);
                    }
                } else {
                    reject(false);
                }
            }
        }
    });
}

/**
 * Upload an image and caption to the Instagram account associated with the provided client.
 *
 * @param {Instagram} client - Instagram API client.
 * @param {Object} data - Data object containing information about the image and caption.
 * @returns {string} - The URL of the posted Instagram post.
 */
const upload = async (client, data) => {
    // Extract keywords from the image explanation
    const matches = (data.explanation || '').match(/the\s+(\w+)/gi);
    const words = matches.map(match => match.split(' ')[1]);

    // Construct the caption for the Instagram post
    const caption = `\nTitle: ${data.title}\n\nDescription: ${data.explanation}\nData collected from NASA and posted by MAD FALCON [bot]\n#${words.join(' #')}`;

    // Upload the image to Instagram and include the caption
    const { media } = await client.uploadPhoto({ photo: path.join(global.projectLocation, 'resizedNewImage.jpg'), caption });

    // Write the current timestamp to 'lastPosted.txt' to track the last posting time
    fs.writeFileSync(path.join(global.projectLocation, 'lastPosted.txt'), Date.now().toString());

    // Return the URL of the posted Instagram post
    return `[+] Post url: https://www.instagram.com/p/${media.code}/`;
}

/**
 * Main function for posting an image and caption to an Instagram account.
 *
 * @param {Object} data - Data object containing information about the image and caption.
 */
module.exports = async (data) => {
    const client = new Instagram({ username: INSTA_USER, password: INSTA_PASS, cookieStore });

    try {
        // Attempt to login to the Instagram account
        const res = await clientLogin(client);

        // If login is unsuccessful, display a notification and exit
        if (!res) return notifier({ message: 'Login unsuccessful.' });

        // Display a notification for a successful login
        notifier({ message: 'Login successful', notify: false });

        // Upload the image and caption to Instagram
        const link = await upload(client, data);

        // Display a notification with the URL of the posted Instagram post
        notifier({ message: `Image posted. Link: ${link}` });
    } catch (err) {
        notifier({ message: err, notify: false });

        // Handle the case where a 403 status code is encountered
        if (err.statusCode === 403) {
            const res = await clientLogin(client);

            // If login is unsuccessful, display a notification and exit
            if (!res) return notifier({ message: 'Login unsuccessful.' });

            // Display a notification for a successful login
            notifier({ message: 'Login successful', notify: false });

            // Upload the image and caption to Instagram
            const link = await upload(client, data);

            // Display a notification with the URL of the posted Instagram post
            notifier({ message: `Image posted. Link: ${link}` });
        } else {
            notifier({ message: err.message });
        }
    }
};
