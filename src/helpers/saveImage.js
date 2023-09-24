const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
const notifier = require('./notifier');

/**
 * Download an image from a specified URL, save it locally, resize it, and save the resized image.
 *
 * @param {Object} options - Configuration options for the download and resize process.
 * @param {string} options.url - The URL of the image to download.
 * @param {string} dest - The destination path where the downloaded image will be saved.
 */
module.exports = async ({ url }, dest) => {
    try {
        // Create a write stream to save the image locally
        const file = fs.createWriteStream(dest);

        // Use Axios to make an HTTP GET request to the specified URL with response stream
        const { data } = await axios.get(url, { responseType: 'stream' });

        // Pipe the response data (image content) to the file stream
        data.pipe(file);

        // Wait for the file write operation to finish
        const res = await new Promise((resolve, reject) => {
            // Listen for the 'finish' event when writing is complete
            file.on('finish', () => {
                // Notify that the image has been saved
                notifier({ message: 'Image saved', notify: false });

                // Use Sharp to resize the saved image and save the resized image
                sharp(dest).resize(1696, 1064).toFile(path.join(global.projectLocation, 'resizedNewImage.jpg'), (err, info) => {
                    if (err) reject(err.message); // Handle errors during resizing
                    resolve(info); // Resolve with resizing information
                });
            });

            // Listen for the 'error' event if any errors occur during writing
            file.on('error', e => reject(e.message));
        });

        // Check if the resizing operation resulted in a non-empty image
        if (res.size) {
            notifier({ message: 'Image resized', notify: false }); // Notify that the image has been resized
            return; // Exit the function
        }
    } catch (e) {
        // Handle errors during the download or resize process and notify the user
        notifier({ message: `Error while downloading image.\n${e.message}` });
    }
}
