require('dotenv').config();
const axios = require('axios');
const { downloadImage } = require('./functions/downloadImage');
const { handleFBUpload } = require('./functions/handleFBUpload');

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

/**
 * This is the root function from where all the process starts.
 */
const root = async () => {
    const { data } = await axios.get('https://api.nasa.gov/planetary/apod?api_key=4pGVKh4vTlU2QdTZfBgM0s6iuDhKhbyvMkJxg70H')
    await downloadImage(data.url, './' + data.title + '.jpg');
    console.log(`[+] Image downloaded for ${data.date}`);
    await handleFBUpload(data);
    console.log(`[+] Image uploaded to facebook for ${data.date}`);
}

const main = () => {
    root();
    setInterval(async () => {
        root();
    }, 60000); //86400000 = 1 day
}
main();