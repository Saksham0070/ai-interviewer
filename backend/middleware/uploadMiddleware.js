import multer from "multer";
import fs from "fs";
import os from "os";
import path from "path";

// Audio is short-lived: it is transcribed and deleted after evaluation. Keeping it
// outside the project avoids development watchers restarting the API on every upload.
const uploadDirectory = path.join(os.tmpdir(), "ai-interviewer-uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory);
    },
    filename(req, file, cb) {
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        const sessionId = req.params.id || 'unknown-session';
        cb(null, `${sessionId}-${Date.now()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
        cb(null, true);
    } else {
        cb(new Error('Only audio files are allowed'), false);
    }
};
const upload = multer({ storage: storage, fileFilter,limits: { fileSize: 10 * 1024 * 1024 } });   

// Keep this field name in sync with the FormData key used by InterviewRunner.
const uploadSingleAudio = upload.single('audioFile');
console.log("uploadSingleAudio middleware initialized.");

export { uploadSingleAudio };
