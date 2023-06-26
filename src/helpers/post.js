const fs = require('fs');
const Instagram = require('instagram-web-api');
const FileCookieStore = require('tough-cookie-filestore2');
const getCode = require('./getCode');
const path = require('path');
const notifier = require('./notifier');
const cookieStore = new FileCookieStore(path.join(global.projectLocation, 'cookies.json'));
const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve(''), ms));
const { INSTA_USER, INSTA_PASS } = process.env;
const hashTags = ['Astronomy', 'Astrophotography', 'SpaceExploration', 'NASA', 'StarryNight', 'Cosmos', 'Galaxy', 'Nebula', 'Stars', 'Universe', 'Celestial', 'AstronomyPhotography', 'NightSky', 'AstronomyLovers', 'Astrophoto', 'SpaceScience', 'Planetarium', 'MilkyWay', 'SolarSystem', 'AstronomyPictureOfTheDay'];

const clientLogin = async (client) => {
    const res = await new Promise(async (resolve, reject) => {
        try {
            const res = await client.login({}, { _sharedData: false });
            if (res.authenticated) resolve(res.authenticated)
        }
        catch (err) {
            notifier({ message: err, notify: false });
            try {
                if (err.error?.message === 'checkpoint_required') {
                    const challengeUrl = err.error.checkpoint_url
                    const res = await client.updateChallenge({ challengeUrl, choice: 1 })
                    if (res.challengeType === 'VerifyEmailCodeForm') {
                        await sleep(10000)
                        const code = await getCode();
                        const { navigation: { forward } } = res;
                        if (code) {
                            const res = await client.updateChallenge({ challengeUrl: `${forward}`, choice: 0, securityCode: code })
                            notifier({ message: res, notify: false });
                            if (res.status === 'ok') resolve(res)
                        }
                    }
                    else {
                        notifier({ message: res, notify: false });
                        resolve(res);
                    }
                }
            }
            catch (err) {
                notifier({ message: err, notify: false });
                if (err.error?.challenge?.challengeType === 'VerifyEmailCodeForm') {
                    await sleep(10000)
                    const code = await getCode();
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
    const matches = (data.explanation || '').match(/the\s+(\w+)/gi);
    const words = matches.map(match => match.split(' ')[1]);
    const caption = `\nTitle: ${data.title}\n\nDescription: ${data.explanation}\nData collected from NASA and posted by MAD FALCON [bot]
    \n#${words.join(' #')}`;
    const { media } = await client.uploadPhoto({ photo: path.join(global.projectLocation, 'resizedNewImage.jpg'), caption });
    fs.writeFileSync(path.join(global.projectLocation, 'lastPosted.txt'), Date.now().toString());
    return `[+] Post url: https://www.instagram.com/p/${media.code}/`
}

module.exports = async (data) => {
    const client = new Instagram({ username: INSTA_USER, password: INSTA_PASS, cookieStore });
    try {
        const res = await clientLogin(client);
        if (!res) return notifier({ message: 'Login unsuccessful.' })
        notifier({ message: 'Login successfull', notify: false });
        const link = await upload(client, data);
        notifier({ message: `Image posted. Link: ${link}` });
    }
    catch (err) {
        notifier({ message: err, notify: false });
        if (err.statusCode === 403) {
            const res = await clientLogin(client);
            if (!res) return notifier({ message: 'Login unsuccessful.' });
            notifier({ message: 'Login successfull', notify: false });
            const link = await upload(client, data);
            notifier({ message: `Image posted. Link: ${link}` });
        }
        else notifier({ message: err.message })
    }
};



