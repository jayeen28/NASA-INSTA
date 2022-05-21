const { INSTA_USER, INSTA_PASS } = process.env;
const Instagram = require('instagram-web-api');
const FileCookieStore = require('tough-cookie-filestore2');

module.exports = {
    handleInstaPost: async (data) => {
        const cookieStore = new FileCookieStore('cookies.json');
        const client = new Instagram({ username: INSTA_USER, password: INSTA_PASS, cookieStore });
        try {
            await client.login();
            const caption = `Title: ${data.title} \n\nExplaination: ${data.explanation} \n\n\n\nData collected from NASA and posted by MAD FALCON [bot]`;
            const { media } = await client.uploadPhoto({ photo: 'resizedNewImage.jpg', caption });
            console.log('[+] Image uploaded to instagram.');
            console.log(`[+] Post url: https://www.instagram.com/p/${media.code}/`);
        }
        catch (err) {
            console.error(`[+] ${err}`);
        }
    }
}