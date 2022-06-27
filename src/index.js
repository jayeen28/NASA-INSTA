require('dotenv').config();
const axios = require('axios');
const { downloadAndPost } = require('./helpers/downloadAndPost');
require('./helpers/getCode');
const app = require('express')();
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`[+] Server started on port ${port}`);
});

// PingPong
app.get('/ping', async (req, res) => { res.status(200).send('Pong') })

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

/**
 * This is the root function from where all the process starts.
 */
const root = async () => {
    const { data } = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`);
    await downloadAndPost(data, 'newImage.jpg');
}
setTimeout(() => {
    root();
}, 86400000);//86400000 = 1 day
const main = () => {
    root();
    setInterval(function () {
        axios.get(process.env.HEROKU_URL || 'http://localhost:5000/ping')
        console.log('[+] Make dyno fool.')
    }, 300000);
}
main();