const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Set up storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Endpoint to handle file upload and conversion to MP3
app.post('/upload', upload.single('audio'), (req, res) => {
    const filePath = req.file.path;
    const outputFilePath = path.join('uploads', `${Date.now()}.mp3`);

    // Convert to mp3 using ffmpeg
    ffmpeg(filePath)
        .toFormat('mp3')
        .on('end', () => {
            fs.unlinkSync(filePath); // Remove the original file
            res.send({ message: 'File uploaded and converted successfully', file: outputFilePath });
        })
        .on('error', (err) => {
            console.error(err);
            res.status(500).send({ message: 'Error processing file' });
        })
        .save(outputFilePath);
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint to list all files in the uploads directory
app.get('/list-uploads', (req, res) => {
    fs.readdir('uploads', (err, files) => {
        if (err) {
            return res.status(500).send({ message: 'Unable to scan directory' });
        }
        res.send(files);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
