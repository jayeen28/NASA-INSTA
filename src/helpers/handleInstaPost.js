const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve(''), ms))
const { INSTA_USER, INSTA_PASS } = process.env;
const Instagram = require('instagram-web-api');
const FileCookieStore = require('tough-cookie-filestore2');
const getCode = require('./getCode');
const cookieStore = new FileCookieStore('./cookies.json');

const clientLogin = async (client) => {
    const res = await new Promise(async (resolve, reject) => {
        try {
            const res = await client.login({}, { _sharedData: false });
            if (res.authenticated) resolve(res.authenticated)
        }
        catch (err) {
            console.log(err)
            try {
                if (err.error?.message === 'checkpoint_required') {
                    const challengeUrl = err.error.checkpoint_url
                    const res = await client.updateChallenge({ challengeUrl, choice: 1 })
                    if (res.challengeType === 'VerifyEmailCodeForm') {
                        await sleep(10000)
                        const code = await getCode();
                        console.log({ code1: code })
                        const { navigation: { forward } } = res;
                        if (code) {
                            const res = await client.updateChallenge({ challengeUrl: `${forward}`, choice: 0, securityCode: code })
                            console.log(res)
                            if (res.status === 'ok') resolve(res)
                        }
                    }
                    else resolve();
                }
            }
            catch (err) {
                console.log(err)
                if (err.error?.challenge?.challengeType === 'VerifyEmailCodeForm') {
                    await sleep(10000)
                    const code = await getCode();
                    console.log({ code2: code })
                    const { options: { uri } } = err;
                    if (code) {
                        const res = await client.updateChallenge({ challengeUrl: `${uri}`, choice: 0, securityCode: code })
                        if (res.status === 'ok') resolve(res)
                    }
                }
                else reject();
            }
        }
    })
    if (res) return true;
    return false;
}

const upload = async (client, data) => {
    const caption = `Title: ${data.title} \n\nExplaination: ${data.explanation} \n\n\n\nData collected from NASA and posted by MAD FALCON [bot]`;
    const { media } = await client.uploadPhoto({ photo: 'resizedNewImage.jpg', caption });
    console.log('[+] Image uploaded to instagram.');
    return `[+] Post url: https://www.instagram.com/p/${media.code}/`
}

module.exports = {
    handleInstaPost: async (data) => {
        const client = new Instagram({ username: INSTA_USER, password: INSTA_PASS, cookieStore });
        try {
            const res = await clientLogin(client);
            if (!res) return console.log(`[+] Login unsuccessful.`)
            console.log('[+] Login successfull')
            const uploadRes = await upload(client, data);
            console.log(uploadRes)
        }
        catch (err) {
            console.log(err)
            if (err.statusCode === 403) {
                const res = await clientLogin(client);
                if (!res) return console.log(`[+] Login unsuccessful.`)
                console.log('[+] Login successfull')
                const uploadRes = await upload(client, data);
                console.log(uploadRes)
            }
            else console.error(`[-] ${err.message}`);
        }
    }
}



