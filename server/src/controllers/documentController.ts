import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import db from '../db/connection.js';
import { AuthRequest } from '../middleware/auth.js';
import { extractTextFromFile } from '../engine/preprocessor.js';

export async function uploadDocument(req: AuthRequest, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  try {
    const fileBuffer = fs.readFileSync(file.path);
    const extractedText = await extractTextFromFile(fileBuffer, file.mimetype);

    const docId = 'doc_' + uuidv4().slice(0, 16);
    db.prepare(`
      INSERT INTO document_uploads (id, user_id, filename, original_name, mime_type, file_size, extracted_text)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      docId,
      req.user?.id || 'usr_anonymous',
      file.filename,
      file.originalname,
      file.mimetype,
      file.size,
      extractedText
    );

    res.status(201).json({
      message: 'Document uploaded and text extracted successfully',
      document: {
        id: docId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        extractedText
      }
    });
  } catch (error: any) {
    console.error('Document extraction error:', error);
    res.status(500).json({ error: `Failed to process document: ${error.message}` });
  }
}
