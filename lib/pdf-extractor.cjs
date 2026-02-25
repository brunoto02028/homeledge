/**
 * PDF Text Extractor - Standalone Node.js script
 * Run with: node pdf-extractor.cjs <file-path>
 * Or: cat base64data | node pdf-extractor.cjs --stdin
 */

const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function extractText(pdfBuffer) {
  const parser = new PDFParse({ data: pdfBuffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text || '';
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', chunk => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', reject);
  });
}

async function main() {
  try {
    let pdfBuffer;
    const arg = process.argv[2];
    
    if (arg === '--stdin') {
      // Read base64 from stdin
      const base64Data = await readStdin();
      pdfBuffer = Buffer.from(base64Data.trim(), 'base64');
    } else if (arg && arg.startsWith('/') && fs.existsSync(arg)) {
      // File path provided
      pdfBuffer = fs.readFileSync(arg);
    } else if (arg) {
      // Base64 string provided directly (small files)
      pdfBuffer = Buffer.from(arg, 'base64');
    } else {
      throw new Error('No input provided. Use --stdin, file path, or base64 data');
    }
    
    const text = await extractText(pdfBuffer);
    console.log(JSON.stringify({ success: true, text, length: text.length }));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

main();
