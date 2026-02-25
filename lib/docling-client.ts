/**
 * HomeLedger Docling Client
 * Communicates with the Docling Python microservice for document processing.
 */

const DOCLING_URL = process.env.DOCLING_SERVICE_URL || 'http://127.0.0.1:3200';

interface DoclingExtractResult {
  success: boolean;
  file_name: string;
  file_size?: number;
  plain_text: string;
  markdown_text?: string;
  text_length: number;
  tables: DoclingTable[];
  table_count: number;
  page_count?: number;
  error?: string;
}

interface DoclingTable {
  index?: number;
  markdown?: string;
  headers?: string[];
  rows?: any[][];
  row_count?: number;
}

interface DoclingBankStatementResult {
  success: boolean;
  file_name: string;
  plain_text: string;
  tables_markdown: string[];
  tables_structured: { headers: string[]; rows: any[][] }[];
  table_count: number;
  text_length: number;
  error?: string;
}

interface DoclingInvoiceResult {
  success: boolean;
  file_name: string;
  plain_text: string;
  markdown_text: string;
  tables: DoclingTable[];
  table_count: number;
  text_length: number;
  error?: string;
}

export async function checkDoclingHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${DOCLING_URL}/health`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function extractDocument(
  fileBuffer: Buffer,
  fileName: string
): Promise<DoclingExtractResult> {
  const formData = new FormData();
  formData.append('file_base64', fileBuffer.toString('base64'));
  formData.append('file_name', fileName);

  const res = await fetch(`${DOCLING_URL}/extract`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Docling extract failed: ${res.status} - ${text}`);
  }

  return res.json();
}

export async function extractBankStatement(
  fileBuffer: Buffer,
  fileName: string
): Promise<DoclingBankStatementResult> {
  const formData = new FormData();
  formData.append('file_base64', fileBuffer.toString('base64'));
  formData.append('file_name', fileName);

  const res = await fetch(`${DOCLING_URL}/extract-bank-statement`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Docling bank statement extract failed: ${res.status} - ${text}`);
  }

  return res.json();
}

export async function extractInvoice(
  fileBuffer: Buffer,
  fileName: string
): Promise<DoclingInvoiceResult> {
  const formData = new FormData();
  formData.append('file_base64', fileBuffer.toString('base64'));
  formData.append('file_name', fileName);

  const res = await fetch(`${DOCLING_URL}/extract-invoice`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Docling invoice extract failed: ${res.status} - ${text}`);
  }

  return res.json();
}
