const { INSTA_USER, INSTA_PASS } = process.env;
const Instagram = require('instagram-web-api');
const FileCookieStore = require('tough-cookie-filestore2');
const cookieStore = new FileCookieStore('./cookies.json');
const client = new Instagram({ username: INSTA_USER, password: INSTA_PASS, cookieStore });

const clientLogin = async (client) => {
    const res = await new Promise(async (resolve, reject) => {
        try {
            const res = await client.login();
            if (res.status === 'ok') return resolve(res.status)
        }
        catch (err) {
            console.log(err)
            if (err.error?.message === 'checkpoint_required') {
                const challengeUrl = err.error.checkpoint_url
                const res = await client.updateChallenge({ challengeUrl, choice: 1 })
                if (res.status === 'ok') resolve(res.status)
                else reject(res.status);
            }
        }
    })
    if (res === 'ok') return true;
    return false;
}

module.exports = {
    handleInstaPost: async (data) => {
        try {
            const res = await clientLogin(client);
            if (!res) return console.log(`[+] Login unsuccessful.`)
            const caption = `Title: ${data.title} \n\nExplaination: ${data.explanation} \n\n\n\nData collected from NASA and posted by MAD FALCON [bot]`;
            const { media } = await client.uploadPhoto({ photo: 'resizedNewImage.jpg', caption });
            console.log('[+] Image uploaded to instagram.');
            console.log(`[+] Post url: https://www.instagram.com/p/${media.code}/`);
        }
        catch (err) {
            if (err.message === 'login_required') console.log('Found the login issue bro')
            console.error(`[+] ${err}`);
        }
    }
}