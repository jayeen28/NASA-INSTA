const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Set the project location based on the 'projectPath' environment variable or the current working directory
global.projectLocation = process.env.projectPath || path.resolve();

// Load environment variables from a '.env' file in the project directory
require('dotenv').config();

// Import custom helper functions
const saveImage = require('./helpers/saveImage');
const post = require('./helpers/post');
const getTimeStr = require('./helpers/getTimeStr');
const notifier = require('./helpers/notifier');

// Define a variable to store a timeout reference
let timeOut;

// Handle unhandled promise rejections and notify with details
process.on('unhandledRejection', (reason, p) => {
    notifier({ message: `Unhandled Rejection at: Promise ${p}\nreason:${reason}`, notify: false });
});

// Function to measure time since the last post
const measureTime = () => {
    // Define the path to the 'lastPosted.txt' file within the project directory
    const lastPostedPath = path.join(global.projectLocation, 'lastPosted.txt');

    // If 'lastPosted.txt' does not exist, create it and indicate that the script should start
    if (!fs.existsSync(lastPostedPath)) {
        fs.writeFileSync(lastPostedPath, '', 'utf-8');
        return { shouldStart: true };
    }

    // Read the timestamp from 'lastPosted.txt'
    const lastPosted = parseInt(fs.readFileSync(lastPostedPath, 'utf-8'));

    // If the timestamp is not a valid number, indicate that the script should start
    if (isNaN(lastPosted)) return { shouldStart: true };

    // Calculate the timestamp for 24 hours ago
    const before24h = Date.now() - 86400000; // 86400000 milliseconds = 24 hours

    // Check if the script should start (if the last post was more than 24 hours ago)
    return { shouldStart: lastPosted < before24h, timeLeft: lastPosted - before24h };
};

// Main function to start the NASA-INSTA process
const start = async () => {
    try {
        // Clear any existing timeout
        clearTimeout(timeOut);

        // Notify that the NASA-INSTA process has started
        notifier({ message: 'NASA-INSTA process started.' });

        // Fetch data from the NASA API using the provided API key
        const { data } = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`);

        // Save the fetched image data to a file named 'newImage.jpg' within the project directory
        await saveImage(data, path.join(global.projectLocation, 'newImage.jpg'));

        // Post the fetched data
        await post(data);

        // Set a timeout to restart the script after 24 hours
        timeOut = setTimeout(() => {
            notifier({ message: 'The script will restart after 24 hours' })
            start();
        }, 86400000); // 86400000 milliseconds = 24 hours
    }
    catch (e) {
        // Notify if an error occurs during the process
        notifier({ message: e, notify: true });
    }
}

// Main function to control the script execution
const main = () => {
    // Determine if the script should start or wait
    const { shouldStart, timeLeft } = measureTime();
    if (shouldStart) {
        // Start the script immediately
        start();
    } else {
        // Notify when the script will start based on the remaining time
        notifier({ message: `The script will start after ${getTimeStr(timeLeft)}` });

        // Set a timeout to start the script after the remaining time
        timeOut = setTimeout(() => start(), timeLeft);
    }
}

// Start the main script
main();
