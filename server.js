const express = require('express');
const fs = require('fs');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Upload endpoint
app.post('/upload', upload.single('audio'), (req, res) => {
  const audioPath = req.file.path;
  const outputFileName = `audio_${Date.now()}.mp3`;
  const outputPath = path.join(__dirname, 'public', 'audio', outputFileName);

  // Convert to MP3
  ffmpeg(audioPath)
    .audioBitrate(128)
    .save(outputPath)
    .on('end', () => {
      fs.unlinkSync(audioPath); // Delete the original file
      res.json({ message: 'Audio uploaded and converted', file: outputFileName });
    })
    .on('error', err => {
      console.error(err);
      res.status(500).send('Error processing audio file');
    });
});

// Serve MP3 files
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')));

// List all MP3 files
app.get('/list', (req, res) => {
  const audioDir = path.join(__dirname, 'public', 'audio');
  fs.readdir(audioDir, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan directory');
    }
    res.json(files.filter(file => file.endsWith('.mp3')));
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
