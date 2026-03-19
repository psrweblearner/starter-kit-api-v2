// services/v1/fileManager/uploadChunkFile.js
'use strict';
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');

const sessions = new Map();
const TEMP_DIR = path.join(os.tmpdir(), 'fm_chunks');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

module.exports = async (req, res) => {
    return new Promise((resolve, reject) => {
        const chunkUpload = multer({ storage: multer.memoryStorage() }).single('chunk');

        chunkUpload(req, res, (err) => {
            if (err) {
                return reject(new Error(err.message));
            }

            const { folderName = '', folder_id, fileName, chunkIndex, totalChunks, fileId } = req.body;

            if (!req.file || !fileName || typeof chunkIndex === 'undefined' || !totalChunks || !fileId) {
                return reject(new Error('Invalid chunk payload'));
            }

            const sessionKey = `simple_${fileId}`;
            let session = sessions.get(sessionKey);

            if (!session) {
                const sessionDir = path.join(TEMP_DIR, sessionKey);
                fs.mkdirSync(sessionDir, { recursive: true });
                session = {
                    sessionDir,
                    fileName,
                    totalChunks: Number(totalChunks),
                    folder: folderName,
                    folder_id: folder_id
                };
                sessions.set(sessionKey, session);
            }

            const partPath = path.join(session.sessionDir, `${Number(chunkIndex)}.part`);
            fs.writeFileSync(partPath, req.file.buffer);

            resolve({ data: { success: true }, name: 'uploadChunkFile' });
        });
    });
};

// Export sessions for mergeChunksFile to access
module.exports.sessions = sessions;
module.exports.TEMP_DIR = TEMP_DIR;
