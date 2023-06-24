const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
const notifier = require('./notifier');

module.exports = async ({ url }, dest) => {
    try {
        const file = fs.createWriteStream(dest);
        const { data } = await axios.get(url, { responseType: 'stream' });
        data.pipe(file);
        const res = await new Promise((resolve, reject) => {
            file.on('finish', () => {
                notifier({ message: 'Image saved', notify: false });
                sharp(dest).resize(1696, 1064).toFile(path.join(global.projectLocation, 'resizedNewImage.jpg'), (err, info) => {
                    if (err) reject(err.message);
                    resolve(info);
                });
            });
            file.on('error', e => reject(e.message));
        });
        if (res.size) {
            notifier({ message: 'Image resized', notify: false });
            return;
        }
    }
    catch (e) {
        notifier({ message: `Error while downloading image.\n${e.message}` });
    }
}