const { exec } = require('child_process');
const path = require('path');

/**
 * Display a desktop notification.
 *
 * @param {Object} options - Notification options.
 * @param {string} options.title - The title of the notification (default is "Message from NASA-INSTA").
 * @param {string} options.message - The message content of the notification.
 * @param {boolean} options.notify - Whether to show the notification (default is true).
 * @param {string} options.icon - The path to the notification icon (default is 'logo.png' in the project directory).
 */
module.exports = function ({ title = "Message from NASA-INSTA", message = "", notify = true, icon = path.join(global.projectLocation, 'logo.png') }) {
    // Log the message to the console
    console.log(`[+] ${message}`);

    // Check if the notification should be displayed
    if (notify) {
        // Execute the 'notify-send' shell command to show the desktop notification
        exec(`notify-send "${title}" "${message}" -i ${icon}`, function (err, stdout, stderr) {
            // Handle any errors or output from the shell command
            if (err || stderr) {
                console.log(err || stderr); // Log errors or stderr output to the console
            }
        });
    }
}
