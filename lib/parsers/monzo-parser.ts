/**
 * Monzo Bank Statement Parser
 * Extracts transactions from Monzo PDF text
 */

export interface ParsedTransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance: number | null;
}

export interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  accountInfo: {
    bankName: string;
    sortCode: string | null;
    accountNumber: string | null;
    periodStart: string | null;
    periodEnd: string | null;
  };
  summary: {
    totalCredits: number;
    totalDebits: number;
  };
  parseError: string | null;
}

// Convert DD/MM/YYYY to YYYY-MM-DD
function convertDate(dateStr: string): string {
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return dateStr;
}

// Parse amount string like "-140.00" or "950.00" or "-1,234.56"
function parseAmount(amountStr: string): number {
  const cleaned = amountStr.replace(/[,£]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

// Parse balance string like "1,234.56"
function parseBalance(balanceStr: string): number | null {
  if (!balanceStr) return null;
  const cleaned = balanceStr.replace(/[,£]/g, '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

export function parseMonzoStatement(text: string): ParseResult {
  const transactions: ParsedTransaction[] = [];
  let parseError: string | null = null;
  
  // Extract period from header: "01/10/2024 - 16/12/2025"
  let periodStart: string | null = null;
  let periodEnd: string | null = null;
  const periodMatch = text.match(/(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/);
  if (periodMatch) {
    periodStart = convertDate(periodMatch[1]);
    periodEnd = convertDate(periodMatch[2]);
  }
  
  // Extract sort code and account number
  let sortCode: string | null = null;
  let accountNumber: string | null = null;
  const sortCodeMatch = text.match(/Sort code:\s*(\d{2}-\d{2}-\d{2})/);
  const accountMatch = text.match(/Account number:\s*(\d+)/);
  if (sortCodeMatch) sortCode = sortCodeMatch[1];
  if (accountMatch) accountNumber = accountMatch[1];
  
  console.log('[MonzoParser] Period:', periodStart, '-', periodEnd);
  console.log('[MonzoParser] Sort code:', sortCode, 'Account:', accountNumber);
  
  // Remove page markers "-- X of Y --"
  const cleanedText = text.replace(/--\s*\d+\s*of\s*\d+\s*--/g, '');
  
  // Split into lines
  const lines = cleanedText.split('\n').map(l => l.trim()).filter(l => l);
  
  // Regex for transaction lines
  // Pattern: DD/MM/YYYY <description> <amount> <balance>
  // Amount can be negative (-123.45) or positive (123.45)
  // Balance is always positive with possible comma
  
  // Two-pass approach:
  // 1. Find lines that start with a date
  // 2. Collect description from subsequent lines until next date or amount pattern
  
  const datePattern = /^(\d{2}\/\d{2}\/\d{4})\s+(.*)$/;
  const amountBalancePattern = /(-?[\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*$/;
  const amountOnlyPattern = /(-?[\d,]+\.\d{2})\s*$/;
  
  let currentDate: string | null = null;
  let currentDescParts: string[] = [];
  let totalCredits = 0;
  let totalDebits = 0;
  
  function flushTransaction(amountStr: string, balanceStr: string | null) {
    if (!currentDate) return;
    
    const description = currentDescParts.join(' ').trim();
    if (!description) return;
    
    const amount = parseAmount(amountStr);
    const balance = balanceStr ? parseBalance(balanceStr) : null;
    const type = amount < 0 ? 'debit' : 'credit';
    
    // Skip if it looks like a header row
    if (description.includes('Date') && description.includes('Description')) return;
    if (description.includes('(GBP) Amount')) return;
    
    transactions.push({
      date: convertDate(currentDate),
      description,
      amount: Math.abs(amount),
      type,
      balance,
    });
    
    if (type === 'credit') {
      totalCredits += Math.abs(amount);
    } else {
      totalDebits += Math.abs(amount);
    }
    
    currentDescParts = [];
  }
  
  for (const line of lines) {
    // Check if line starts with a date
    const dateMatch = line.match(datePattern);
    
    if (dateMatch) {
      // Check if this line also contains amount and balance at the end
      const rest = dateMatch[2];
      const amtBalMatch = rest.match(amountBalancePattern);
      
      if (amtBalMatch) {
        // Flush previous transaction if any
        if (currentDate && currentDescParts.length > 0) {
          // Previous transaction didn't have amount on its line - try to find it
          const lastPart = currentDescParts[currentDescParts.length - 1];
          const lastAmtMatch = lastPart.match(amountBalancePattern);
          if (lastAmtMatch) {
            currentDescParts[currentDescParts.length - 1] = lastPart.replace(amountBalancePattern, '').trim();
            flushTransaction(lastAmtMatch[1], lastAmtMatch[2]);
          }
        }
        
        // Start new transaction with complete info
        currentDate = dateMatch[1];
        const desc = rest.replace(amountBalancePattern, '').trim();
        currentDescParts = [desc];
        flushTransaction(amtBalMatch[1], amtBalMatch[2]);
        currentDate = null;
      } else {
        // Date line without amount - might be multiline
        // Flush previous
        if (currentDate && currentDescParts.length > 0) {
          const combined = currentDescParts.join(' ');
          const amtMatch = combined.match(amountBalancePattern);
          if (amtMatch) {
            const cleanDesc = combined.replace(amountBalancePattern, '').trim();
            currentDescParts = [cleanDesc];
            flushTransaction(amtMatch[1], amtMatch[2]);
          }
        }
        
        currentDate = dateMatch[1];
        currentDescParts = [rest];
      }
    } else if (currentDate) {
      // Continuation line for current transaction
      // Check if it contains amount/balance
      const amtBalMatch = line.match(amountBalancePattern);
      if (amtBalMatch) {
        const desc = line.replace(amountBalancePattern, '').trim();
        if (desc) currentDescParts.push(desc);
        flushTransaction(amtBalMatch[1], amtBalMatch[2]);
        currentDate = null;
      } else {
        currentDescParts.push(line);
      }
    }
  }
  
  // Flush any remaining transaction
  if (currentDate && currentDescParts.length > 0) {
    const combined = currentDescParts.join(' ');
    const amtMatch = combined.match(amountBalancePattern);
    if (amtMatch) {
      const cleanDesc = combined.replace(amountBalancePattern, '').trim();
      currentDescParts = [cleanDesc];
      flushTransaction(amtMatch[1], amtMatch[2]);
    }
  }
  
  console.log('[MonzoParser] Extracted', transactions.length, 'transactions');
  console.log('[MonzoParser] Credits:', totalCredits.toFixed(2), 'Debits:', totalDebits.toFixed(2));
  
  if (transactions.length === 0) {
    parseError = 'No transactions found in statement text';
  }
  
  return {
    success: transactions.length > 0,
    transactions,
    accountInfo: {
      bankName: 'Monzo',
      sortCode,
      accountNumber,
      periodStart,
      periodEnd,
    },
    summary: {
      totalCredits,
      totalDebits,
    },
    parseError,
  };
}

// Detect if text is from Monzo
export function isMonzoStatement(text: string): boolean {
  const indicators = [
    'Monzo',
    'MONZ',
    'monzo.com',
    'Sort code: 04-00-03',
    'BIC: MONZGB2L',
  ];
  return indicators.some(ind => text.includes(ind));
}
