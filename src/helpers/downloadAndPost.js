const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');
const { handleInstaPost } = require('./handleInstaPost');

module.exports = {
    /**
     * This function is used to download image from the api.
     * @param {String} url The url of the image
     * @param {String} dest The destination of the image
    */
    downloadAndPost: async (data, dest) => {
        const file = fs.createWriteStream(dest);
        const request = axios.get(data.url, {
            responseType: 'stream'
        });
        request.then(async response => {
            response.data.pipe(file);
            const res = await new Promise((resolve, reject) => {
                file.on('finish', () => {
                    sharp('newImage.jpg').resize(1696, 1064).toFile('resizedNewImage.jpg', (err, info) => {
                        if (err) reject(err.message);
                        resolve(info);
                    });
                });
                file.on('error', e => reject(e.message));
            });
            if (res.size) {
                console.log('[+] Image resized');
                await handleInstaPost(data)
            }
        })
    }
}