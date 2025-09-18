import { authenticate } from '@xboxreplay/xboxlive-auth';
import XboxLiveAPI from '@xboxreplay/xboxlive-api';
import fs from 'fs';
import path from 'path';






var gamertag = 'Your_Gamertag'

const downloadDirimg = './downloaded_images';
const downloadDirclip = './downloaded_clips';

const createDownloadDir = () => {
  if (!fs.existsSync(downloadDirimg)) {
    fs.mkdirSync(downloadDirimg);
    console.log(`Created directory: ${downloadDirimg}`);
  }
   if (!fs.existsSync(downloadDirclip)) {
    fs.mkdirSync(downloadDirclip);
    console.log(`Created directory: ${downloadDirclip}`);
  }
};


var auth = await authenticate('YOUR_EMAIL', 'YOUR_PASSWORD');


console.log(auth.user_hash)

XboxLiveAPI.getPlayerSettings(gamertag, {
    userHash: auth.user_hash,
    XSTSToken: auth.xsts_token
}, ['UniqueModernGamertag', 'GameDisplayPicRaw', 'Gamerscore', 'Location'])
    .then(console.info)
    .catch(console.error);




const downloadClips = async () => {
  createDownloadDir();



  const PlayerClips = await XboxLiveAPI.getPlayerGameClips(
     gamertag,
    {
      userHash: auth.user_hash,
    XSTSToken: auth.xsts_token
    },
);






for (const [ClipIndex, clip] of PlayerClips.gameClips.entries()) {
    const clipUris = clip.gameClipUris;

    if (!clipUris || clipUris.length === 0) {
      console.log(`Clip at index ${ClipIndex} has no URIs. Skipping.`);
      continue;
    }

    
    for (const [videoIndex, uriObject] of clipUris.entries()) {
     
      const uri = uriObject.uri;

          const filename = `Clip_${ClipIndex + 1}_video_${videoIndex + 1}.mp4`;
      const filepath = path.join(downloadDirclip, filename);

      console.log(`Downloading ${uri} to ${filepath}...`);

      try {
      
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

       
        const videoArrayBuffer = await response.arrayBuffer();
        const videoBuffer = Buffer.from(videoArrayBuffer);
        
        await fs.promises.writeFile(filepath, videoBuffer);
        console.log(`Successfully downloaded ${filename}`);

      } catch (error) {
        console.error(`Error downloading clip: ${error.message}`);
      }
    }
  }
}
    

const downloadImages = async () => {
  createDownloadDir();



const PlayerScreenshots = await XboxLiveAPI.getPlayerScreenshots(
     gamertag,
    {
      userHash: auth.user_hash,
    XSTSToken: auth.xsts_token
    },
);



for (const [screenshotIndex, screenshot] of PlayerScreenshots.screenshots.entries()) {
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
      const filepath = path.join(downloadDirimg, filename);

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
downloadClips();


