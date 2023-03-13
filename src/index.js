require('dotenv').config();
const axios = require('axios');
const { downloadAndPost } = require('./helpers/downloadAndPost');


process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const main = async () => {
    const { data } = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`);
    await downloadAndPost(data, 'newImage.jpg');
}
main();