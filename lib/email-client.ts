import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const ENC_KEY = process.env.EMAIL_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'default-key-change-me';

// ── Encryption helpers ──────────────────────────────────────────────────────
export function encryptPassword(plaintext: string): string {
  const key = crypto.scryptSync(ENC_KEY, 'salt', 32) as unknown as Uint8Array;
  const iv = crypto.randomBytes(16) as unknown as Uint8Array;
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()] as any[]);
  const tag = cipher.getAuthTag();
  return `${Buffer.from(iv).toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptPassword(encrypted: string): string {
  const [ivHex, tagHex, dataHex] = encrypted.split(':');
  const key = crypto.scryptSync(ENC_KEY, 'salt', 32) as unknown as Uint8Array;
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex') as unknown as Uint8Array);
  decipher.setAuthTag(Buffer.from(tagHex, 'hex') as unknown as Uint8Array);
  return decipher.update(dataHex, 'hex', 'utf8') + decipher.final('utf8');
}

// ── IMAP Connection ─────────────────────────────────────────────────────────
export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
}

export async function createImapConnection(config: ImapConfig): Promise<ImapFlow> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    logger: false,
  });
  await client.connect();
  return client;
}

// ── Fetch folders ───────────────────────────────────────────────────────────
export interface FolderInfo {
  name: string;
  path: string;
  type: string;
  delimiter: string;
}

function classifyFolder(path: string, flags: Set<string>): string {
  const lp = path.toLowerCase();
  if (flags.has('\\Inbox') || lp === 'inbox') return 'inbox';
  if (flags.has('\\Sent') || lp.includes('sent')) return 'sent';
  if (flags.has('\\Drafts') || lp.includes('draft')) return 'drafts';
  if (flags.has('\\Trash') || lp.includes('trash') || lp.includes('deleted')) return 'trash';
  if (flags.has('\\Junk') || lp.includes('spam') || lp.includes('junk')) return 'spam';
  if (flags.has('\\All') || lp.includes('archive') || lp.includes('all mail')) return 'archive';
  return 'custom';
}

export async function fetchFolders(client: ImapFlow): Promise<FolderInfo[]> {
  const mailboxes = await client.list();
  return mailboxes.map((mb) => ({
    name: mb.name,
    path: mb.path,
    type: classifyFolder(mb.path, new Set(Array.from(mb.flags || []).map((f: any) => String(f)))),
    delimiter: mb.delimiter || '/',
  }));
}

// ── Fetch messages from a folder ────────────────────────────────────────────
export interface RawMessage {
  uid: string;
  messageId?: string;
  inReplyTo?: string;
  subject?: string;
  from: { address: string; name?: string };
  to: { address: string; name?: string }[];
  cc: { address: string; name?: string }[];
  date?: Date;
  flags: string[];
  size?: number;
  bodyText?: string;
  bodyHtml?: string;
  hasAttachments: boolean;
  attachments: { filename: string; contentType: string; size: number; contentId?: string }[];
}

export async function fetchMessages(
  client: ImapFlow,
  folderPath: string,
  options: { limit?: number; sinceUid?: string; markSeen?: boolean } = {}
): Promise<RawMessage[]> {
  const lock = await client.getMailboxLock(folderPath);
  try {
    const messages: RawMessage[] = [];
    const range = options.sinceUid ? `${options.sinceUid}:*` : '1:*';
    const fetchOptions: any = {
      uid: true,
      envelope: true,
      flags: true,
      size: true,
      bodyStructure: true,
    };

    let count = 0;
    const limit = options.limit || 50;

    // Fetch latest messages first (reverse order)
    for await (const msg of client.fetch(range, fetchOptions, { uid: true })) {
      if (count >= limit) break;
      const envelope = msg.envelope;
      const from = envelope?.from?.[0] || { address: 'unknown', name: '' };
      const to = envelope?.to || [];
      const cc = envelope?.cc || [];
      const flags = [...(msg.flags || [])].map(f => f.toString());

      // Check for attachments in body structure
      const hasAttachments = checkAttachments(msg.bodyStructure);
      const attachments = extractAttachmentInfo(msg.bodyStructure);

      messages.push({
        uid: msg.uid.toString(),
        messageId: envelope?.messageId || undefined,
        inReplyTo: envelope?.inReplyTo || undefined,
        subject: envelope?.subject || undefined,
        from: { address: from.address || 'unknown', name: from.name || undefined },
        to: to.map((t: any) => ({ address: t.address || '', name: t.name || undefined })),
        cc: cc.map((c: any) => ({ address: c.address || '', name: c.name || undefined })),
        date: envelope?.date || undefined,
        flags,
        size: msg.size,
        hasAttachments,
        attachments,
      });
      count++;
    }
    return messages.reverse(); // newest first
  } finally {
    lock.release();
  }
}

function checkAttachments(structure: any): boolean {
  if (!structure) return false;
  if (structure.disposition === 'attachment') return true;
  if (structure.childNodes) {
    return structure.childNodes.some((c: any) => checkAttachments(c));
  }
  return false;
}

function extractAttachmentInfo(structure: any): { filename: string; contentType: string; size: number; contentId?: string }[] {
  const atts: any[] = [];
  if (!structure) return atts;
  if (structure.disposition === 'attachment' || (structure.disposition === 'inline' && structure.dispositionParameters?.filename)) {
    atts.push({
      filename: structure.dispositionParameters?.filename || structure.parameters?.name || 'attachment',
      contentType: `${structure.type}/${structure.subtype}`,
      size: structure.size || 0,
      contentId: structure.id || undefined,
    });
  }
  if (structure.childNodes) {
    for (const child of structure.childNodes) {
      atts.push(...extractAttachmentInfo(child));
    }
  }
  return atts;
}

// ── Fetch single message body ───────────────────────────────────────────────
export async function fetchMessageBody(
  client: ImapFlow,
  folderPath: string,
  uid: string
): Promise<{ bodyText?: string; bodyHtml?: string }> {
  const lock = await client.getMailboxLock(folderPath);
  try {
    const msg: any = await client.fetchOne(uid, { source: true }, { uid: true });
    if (!msg?.source) return {};
    // Dynamic import mailparser (must be installed: npm i mailparser @types/mailparser)
    try {
      const { simpleParser } = require('mailparser');
      const parsed = await simpleParser(msg.source);
      return {
        bodyText: parsed.text || undefined,
        bodyHtml: (parsed.html as string) || undefined,
      };
    } catch {
      // mailparser not installed, return raw
      return { bodyText: msg.source.toString() };
    }
  } finally {
    lock.release();
  }
}

// ── SMTP Send ───────────────────────────────────────────────────────────────
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
}

export interface SendOptions {
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  inReplyTo?: string;
  references?: string;
}

export async function sendEmail(config: SmtpConfig, options: SendOptions) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  const result = await transporter.sendMail({
    from: options.fromName ? `"${options.fromName}" <${options.from}>` : options.from,
    to: options.to.join(', '),
    cc: options.cc?.join(', '),
    bcc: options.bcc?.join(', '),
    subject: options.subject,
    text: options.text,
    html: options.html,
    inReplyTo: options.inReplyTo,
    references: options.references,
  });
  return result;
}

// ── IMAP provider presets ───────────────────────────────────────────────────
export const PROVIDER_PRESETS: Record<string, { imapHost: string; imapPort: number; smtpHost: string; smtpPort: number; useTls: boolean; note: string }> = {
  gmail: {
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    useTls: true,
    note: 'Use an App Password (not your Google password). Enable at myaccount.google.com/apppasswords',
  },
  outlook: {
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    useTls: true,
    note: 'Use your Microsoft account password or an App Password if 2FA is enabled.',
  },
  yahoo: {
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 587,
    useTls: true,
    note: 'Generate an App Password at login.yahoo.com > Account Security > App Passwords',
  },
  icloud: {
    imapHost: 'imap.mail.me.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.me.com',
    smtpPort: 587,
    useTls: true,
    note: 'Generate an App-Specific Password at appleid.apple.com',
  },
  hostinger: {
    imapHost: 'imap.hostinger.com',
    imapPort: 993,
    smtpHost: 'smtp.hostinger.com',
    smtpPort: 465,
    useTls: true,
    note: 'Use the email password you set in Hostinger hPanel > Emails.',
  },
};

// ── Snippet helper ──────────────────────────────────────────────────────────
export function generateSnippet(text?: string, maxLen = 200): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim().substring(0, maxLen);
}
