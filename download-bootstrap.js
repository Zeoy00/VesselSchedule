const https = require('https');
const fs = require('fs');
const path = require('path');

const files = [
    {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css',
        path: 'public/css/vendor/bootstrap.min.css'
    },
    {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js',
        path: 'public/js/vendor/bootstrap.bundle.min.js'
    }
];

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                response.resume();
                reject(new Error(`Request Failed With a Status Code: ${response.statusCode}`));
            }
        });
    });
}

async function downloadAll() {
    for (const file of files) {
        try {
            await downloadFile(file.url, file.path);
            console.log(`Downloaded: ${file.path}`);
        } catch (error) {
            console.error(`Error downloading ${file.url}:`, error);
        }
    }
}

downloadAll(); 