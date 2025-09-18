import { authenticate } from '@xboxreplay/xboxlive-auth';
import XboxLiveAPI from '@xboxreplay/xboxlive-api';
import fs from 'fs';
import path from 'path';


const gamertag = 'YOUR_GAMER_TAG'
const downloadDir = './downloaded_images';
const createDownloadDir = () => {
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
    console.log(`Created directory: ${downloadDir}`);
  }
};


const auth = await authenticate('YOUR_XBOX_EMAIL', 'YOUR_XBOX_PASSWORD');

console.log(result);

XboxLiveAPI.getPlayerSettings(gamertag, {
    userHash: auth.user_hash,
    XSTSToken: auth.xsts_token,
}, ['UniqueModernGamertag', 'GameDisplayPicRaw', 'Gamerscore', 'Location'])
    .then(console.info)
    .catch(console.error);
    

const downloadImages = async () => {
  createDownloadDir();



const result = await XboxLiveAPI.getPlayerScreenshots(
     gamertag,
    {
        userHash: auth.user_hash,
    XSTSToken: auth.xsts_token,
    },
);

for (const [screenshotIndex, screenshot] of result.screenshots.entries()) {
    const screenshotUris = screenshot.screenshotUris;

    if (!screenshotUris || screenshotUris.length === 0) {
      console.log(`Screenshot at index ${screenshotIndex} has no URIs. Skipping.`);
      continue;
    }

    // Use a nested for...of loop to iterate over each URI within the screenshot
    for (const [imageIndex, uriObject] of screenshotUris.entries()) {
      // Extract the URI from the object
      const uri = uriObject.uri;

      // Generate a unique filename based on the screenshot and image index
          const filename = `screenshot_${screenshotIndex + 1}_image_${imageIndex + 1}.png`;
      const filepath = path.join(downloadDir, filename);

      console.log(`Downloading ${uri} to ${filepath}...`);

      try {
        // Fetch the image data from the URI
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        // Get the image data as an ArrayBuffer and convert it to a Node.js Buffer
        const imageArrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);
        
        // Write the buffer to the file using the modern fs.promises API
        await fs.promises.writeFile(filepath, imageBuffer);
        console.log(`Successfully downloaded ${filename}`);

      } catch (error) {
        console.error(`Error downloading image: ${error.message}`);
      }
    }
  }

  console.log('All downloads attempted.');
};

// Run the function
downloadImages();


