const fs = require('fs');
module.exports({
    /**
     * This function is used to download image from the api.
     * @param {String} url The url of the image
     * @param {String} dest The destination of the image
    */
    downloadImage: async (url, dest) => {
        const file = fs.createWriteStream(dest);
        const request = axios.get(url, {
            responseType: 'stream'
        });
        request.then(response => {
            response.data.pipe(file);
            return new Promise((resolve, reject) => {
                file.on('finish', resolve);
                file.on('error', reject);
            });
        })
    }
})