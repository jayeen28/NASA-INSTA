const fs = require('fs');
const path = require('path');
const axios = require('axios');
global.projectLocation = process.env.projectPath || path.resolve();
require('dotenv').config();
const saveImage = require('./helpers/saveImage');
const post = require('./helpers/post');
const getTimeStr = require('./helpers/getTimeStr');
let timeOut;

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const measureTime = () => {
    const lastPostedPath = path.join(global.projectLocation, 'lastPosted.txt');
    if (!fs.existsSync(lastPostedPath)) {
        fs.writeFileSync(lastPostedPath, '', 'utf-8');
        return { shouldStart: true };
    }
    const lastPosted = parseInt(fs.readFileSync(lastPostedPath, 'utf-8'));
    if (isNaN(lastPosted)) return { shouldStart: true };
    const before24h = Date.now() - 86400000; //86400000=24h
    return { shouldStart: lastPosted < before24h, timeLeft: lastPosted - before24h };
};

const start = async () => {
    try {
        clearTimeout(timeOut);
        console.log('[+] Processed started');
        const { data } = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`);
        await saveImage(data, path.join(global.projectLocation, 'newImage.jpg'));
        await post(data);
        timeOut = setTimeout(() => {
            console.log('The script will restart after 24 hour');
            start();
        }, 86400000);
    }
    catch (e) {
        console.log(e);
    }
}

const main = () => {
    const { shouldStart, timeLeft } = measureTime();
    if (shouldStart) start();
    else {
        console.log(`The script will start after ${getTimeStr(timeLeft)}`);
        timeOut = setTimeout(() => start(), timeLeft);
    }
}
main();