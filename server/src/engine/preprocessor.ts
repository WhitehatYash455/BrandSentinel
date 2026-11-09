import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export interface ExtractedSpan {
  text: string;
  startIndex: number;
  endIndex: number;
  paragraphIndex: number;
}

export interface PreprocessedContent {
  rawText: string;
  normalizedText: string;
  sentences: ExtractedSpan[];
  paragraphs: string[];
  wordCount: number;
}

export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const data = await pdf(buffer);
    return data.text || '';
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  // Plain text or markdown
  return buffer.toString('utf-8');
}

export function preprocessContent(text: string): PreprocessedContent {
  const normalizedText = text.replace(/\r\n/g, '\n');
  const paragraphs = normalizedText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // Split into sentences preserving character offsets
  const sentences: ExtractedSpan[] = [];
  const sentenceRegex = /[^.!?\n]+[.!?]+(?:\s+|$)|[^.!?\n]+$/g;
  let match: RegExpExecArray | null;

  while ((match = sentenceRegex.exec(normalizedText)) !== null) {
    const rawSpan = match[0];
    const trimmed = rawSpan.trim();
    if (trimmed.length > 0) {
      const offsetInSpan = rawSpan.indexOf(trimmed);
      const startIndex = match.index + offsetInSpan;
      const endIndex = startIndex + trimmed.length;

      // Determine paragraph index
      const textBefore = normalizedText.substring(0, startIndex);
      const paragraphIndex = (textBefore.match(/\n\s*\n/g) || []).length;

      sentences.push({
        text: trimmed,
        startIndex,
        endIndex,
        paragraphIndex
      });
    }
  }

  const words = normalizedText.trim().split(/\s+/).filter(w => w.length > 0);

  return {
    rawText: text,
    normalizedText,
    sentences,
    paragraphs,
    wordCount: words.length
  };
}
