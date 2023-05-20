const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');

module.exports = async ({ url }, dest) => {
    try {
        const file = fs.createWriteStream(dest);
        const { data } = await axios.get(url, { responseType: 'stream' });
        data.pipe(file);
        const res = await new Promise((resolve, reject) => {
            file.on('finish', () => {
                console.log('[+] Image saved')
                sharp(dest).resize(1696, 1064).toFile(path.join(global.projectLocation, 'resizedNewImage.jpg'), (err, info) => {
                    if (err) reject(err.message);
                    resolve(info);
                });
            });
            file.on('error', e => reject(e.message));
        });
        if (res.size) {
            console.log('[+] Image resized');
            return;
        }
    }
    catch (e) {
        console.log({ message: 'error while downloading', e });
    }
}