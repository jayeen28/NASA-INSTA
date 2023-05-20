const fs = require('fs');
const path = require('path');
const axios = require('axios');
global.projectLocation = process.env.projectPath || path.resolve();
require('dotenv').config();
const saveImage = require('./helpers/saveImage');
const post = require('./helpers/post');
let timeOutContainer;

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const measureTime = () => {
    const lastPostedPath = path.join(global.projectLocation, 'lastPosted.txt');
    if (!fs.existsSync(lastPostedPath)) fs.writeFileSync(lastPostedPath, '', 'utf-8');
    const time = parseInt(fs.readFileSync(lastPostedPath, 'utf-8'));
    const before24h = Date.now() - 86400000; //86400000=24h
    return { shouldStart: time < before24h, timeLeft: before24h - time };
};

const main = async () => {
    clearTimeout(timeOutContainer);
    try {
        const { shouldStart, timeLeft } = measureTime();
        if (shouldStart) {
            console.log('[+] Processed started');
            const { data } = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`);
            await saveImage(data, path.join(global.projectLocation, 'newImage.jpg'));
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