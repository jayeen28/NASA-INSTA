const { exec } = require('child_process');
const path = require('path');

module.exports = function ({ title = "Message from NASA-INSTA", message = "", notify = true, icon = path.join(global.projectLocation, 'logo.png') }) {
    console.log(`[+] ${message}`);
    if (notify) {
        exec(`notify-send "${title}" "${message}" -i ${icon}`, function (err, stdout, stderr) {
            if (err || stderr) console.log(err || stderr)
        });
    }
}