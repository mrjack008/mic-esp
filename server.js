const express = require('express');
const fs = require('fs');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Ensure the public/audio directory exists
const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Upload endpoint
app.post('/upload', upload.single('audio'), (req, res) => {
  const audioPath = req.file.path;
  const outputFileName = `audio_${Date.now()}.mp3`;
  const outputPath = path.join(audioDir, outputFileName);

  console.log(`Received file: ${audioPath}`);

  // Convert to MP3
  ffmpeg(audioPath)
    .inputFormat('s16le') // Specify input format for raw audio
    .audioFrequency(8000) // Specify the sample rate to match the recording
    .audioChannels(1) // Mono audio
    .audioCodec('libmp3lame') // Use LAME MP3 encoder
    .on('end', () => {
      fs.unlinkSync(audioPath); // Delete the original file
      res.json({ message: 'Audio uploaded and converted', file: outputFileName });
    })
    .on('error', err => {
      console.error('FFmpeg error:', err.message);
      res.status(500).send(`Error processing audio file: ${err.message}`);
    })
    .save(outputPath);
});

// Serve MP3 files
app.use('/audio', express.static(audioDir));

// List all MP3 files
app.get('/list', (req, res) => {
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
