const express = require('express');
const fs = require('fs');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const upload = multer({ dest: 'uploads/' });

let chunks = {};

app.post('/upload', upload.single('audio'), (req, res) => {
  const chunkNumber = parseInt(req.headers['chunk-number'], 10);
  const audioPath = req.file.path;

  console.log(`Received chunk: ${chunkNumber}, file: ${audioPath}`);

  if (!chunks[req.file.originalname]) {
    chunks[req.file.originalname] = [];
  }

  chunks[req.file.originalname][chunkNumber - 1] = fs.readFileSync(audioPath);
  fs.unlinkSync(audioPath);

  if (chunks[req.file.originalname].length === 3) { // Assuming 10 chunks
    const outputFileName = `audio_${Date.now()}.raw`;
    const outputPath = path.join(audioDir, outputFileName);

    fs.writeFileSync(outputPath, Buffer.concat(chunks[req.file.originalname]));
    delete chunks[req.file.originalname];

    ffmpeg(outputPath)
      .inputFormat('s16le')
      .audioFrequency(8000)
      .audioChannels(1)
      .audioCodec('libmp3lame')
      .on('end', () => {
        fs.unlinkSync(outputPath);
        res.json({ message: 'Audio uploaded and converted', file: outputFileName.replace('.raw', '.mp3') });
      })
      .on('error', err => {
        console.error('FFmpeg error:', err.message);
        res.status(500).send(`Error processing audio file: ${err.message}`);
      })
      .save(outputPath.replace('.raw', '.mp3'));
  } else {
    res.json({ message: `Chunk ${chunkNumber} received` });
  }
});

app.use('/audio', express.static(audioDir));

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
