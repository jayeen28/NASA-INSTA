require('dotenv').config();
const axios = require('axios');
const saveImage = require('./helpers/saveImage');
const fs = require('fs');
const post = require('./helpers/post');
let timeOutContainer;

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const measureTime = () => {
    if (!fs.existsSync('lastPosted.txt')) fs.writeFileSync('lastPosted.txt', '', 'utf-8');
    const time = parseInt(fs.readFileSync('lastPosted.txt', 'utf-8'));
    const before24h = Date.now() - 86400000; //86400000=24h
    return { start: time < before24h, timeLeft: before24h - time };
};

const main = async () => {
    clearTimeout(timeOutContainer);
    try {
        const { start, timeLeft } = measureTime();
        if (start) {
            console.log('[+] Processed started');
            const { data } = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`);
            await saveImage(data, 'newImage.jpg');
            await post(data);
        } else {
            timeOutContainer = setTimeout(() => main(), timeLeft);
        }
    }
    catch (e) {
        console.log(e);
    }
}
main();