require('dotenv').config();
const axios = require('axios');
const { downloadImage } = require('./functions/downloadImage');
const { handleInstaPost } = require('./functions/handleInstaPost');

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

/**
 * This is the root function from where all the process starts.
 */
const root = async () => {
    const { data } = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`);
    await downloadImage(data.url, 'newImage.jpg');
    console.log(`[+] Image downloaded for ${data.date}`);
    await handleInstaPost(data);
}

const main = () => {
    root();
    setInterval(function () {
        console.log('[+] Make dyno fool.')
    }, 300000);

    setInterval(() => {
        root();
    }, 86400000); //86400000 = 1 day
}
main();