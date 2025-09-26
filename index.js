import { authenticate } from '@xboxreplay/xboxlive-auth';
import XboxLiveAPI from '@xboxreplay/xboxlive-api';
import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import axios from 'axios';
import archiver from 'archiver';
const app = express()
const port = 5000

app.set('view engine', 'ejs');
app.use(express.static('public')); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'XxSniperPro360xX',
  resave: false,
  saveUninitialized: true
}));


app.get('/', (req, res) => {

  const user = req.session.user;

  if (user) {
    res.redirect('/dashboard')
  } else {

    res.redirect("/login")
  }
})

app.get("/login", (req, res) => {
  res.render("form");
})

app.post("/login",async (req,res) => {
    var email=req.body.email;
    var password=req.body.password;
    var gamertag=req.body.gamertag;

    const user = { gamertag: gamertag, email:email, password:password };
  // Store the entire user object in the session

    var auth = await authenticate(email,password);
    req.session.user = user;
    req.session.auth = auth;
  
  console.log(auth.user_hash);

  gamertag = gamertag.replace('#', '')

  

  const playSettings = await XboxLiveAPI.getPlayerSettings(gamertag, {
      userHash: auth.user_hash,
      XSTSToken: auth.xsts_token
  }, ['UniqueModernGamertag', 'GameDisplayPicRaw', 'Gamerscore', 'Location']);
  req.session.playSettings = playSettings;
      
  res.redirect('/dashboard');
  
    
});

app.get("/dashboard" , async (req, res) => {

  const user = req.session.user;

  if (user) {
    // Render the EJS file with the data from the session
  const auth = req.session.auth;
  const [screenshotData, clipData] = await Promise.all([

        XboxLiveAPI.getPlayerScreenshots(user.gamertag, { userHash: auth.user_hash, XSTSToken: auth.xsts_token }),
        XboxLiveAPI.getPlayerGameclips(user.gamertag, { userHash: auth.user_hash, XSTSToken: auth.xsts_token })
      ]);
  
      // Process screenshots into a clean format for the template
      const screenshots = screenshotData.screenshots.map(item => ({
        type: 'image',
        title: item.titleName,
        date: item.dateTaken,
        url: item.screenshotUris[0]?.uri // Get the first (usually highest quality) URI
      })).filter(item => item.url); // Ensure we only include items with a valid URL
  
      // Process clips into a clean format
      const clips = clipData.gameClips.map(item => ({
        type: 'video',
        title: item.titleName,
        date: item.dateRecorded,
        url: item.gameClipUris[0]?.uri,
        thumbnail: item.thumbnails[0]?.uri 
      })).filter(item => item.url);

 // Combine screenshots and clips, then sort by most recent
    const mediaItems = [...screenshots, ...clips].sort((a, b) => new Date(b.date) - new Date(a.date));  

    res.render('dashboard', { user: user, auth: auth, playSettings: req.session.playSettings, mediaItems });
  } else {
    res.redirect('/login');
  }


});

const sanitizeFilename = (name) => {
  return name.replace(/[:\\/?"*|<>]/g, ''); // Replaces invalid characters with nothing
};

app.get("/download-all", async (req, res) => {

  const user = req.session.user;

  if(!user){
    return res.redirect('/login');
  }

    const auth = req.session.auth;
    const [screenshotData, clipData] = await Promise.all([

        XboxLiveAPI.getPlayerScreenshots(user.gamertag, { userHash: auth.user_hash, XSTSToken: auth.xsts_token }),
        XboxLiveAPI.getPlayerGameclips(user.gamertag, { userHash: auth.user_hash, XSTSToken: auth.xsts_token })
      ]);
  
      // Process screenshots into a clean format for the template
      const screenshots = screenshotData.screenshots.map(item => ({
        type: 'image',
        title: item.titleName,
        date: item.dateTaken,
        url: item.screenshotUris[0]?.uri // Get the first (usually highest quality) URI
      })).filter(item => item.url); // Ensure we only include items with a valid URL
  
      // Process clips into a clean format
      const clips = clipData.gameClips.map(item => ({
        type: 'video',
        title: item.titleName,
        date: item.dateRecorded,
        url: item.gameClipUris[0]?.uri,
        thumbnail: item.thumbnails[0]?.uri 
      })).filter(item => item.url);

 // Combine screenshots and clips, then sort by most recent
    const mediaItems = [...screenshots, ...clips].sort((a, b) => new Date(b.date) - new Date(a.date));

    try{

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="xbox-captures.zip"');

    const zipfile = archiver('zip');

    zipfile.pipe(res);

    if(mediaItems.length > 0){

      await Promise.all(
        mediaItems.map(async (item, index) => {
          
          const response = await axios.get(item.url, { responseType: 'stream' });
  
          const extension = item.type === 'video' ? 'mp4' : 'png';
          
          const filename = `${sanitizeFilename(item.title)}-${index}.${extension}`;
  
          zipfile.append(response.data, { name: filename });
        })
      );
      zipfile.finalize();
    }} catch (error){
      console.log(error);
    }
  
});

app.listen(port, () => {
console.log(`Server listening on http://localhost:${port}`);
})
