/**
 * Utility functions for currency, dates, number-to-words, and code generators
 */

export const formatCurrency = (val: number | string | undefined | null): string => {
  const num = typeof val === 'number' ? val : parseFloat(String(val || 0));
  if (isNaN(num)) return '₹ 0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatCurrencyDec = (val: number | string | undefined | null): string => {
  const num = typeof val === 'number' ? val : parseFloat(String(val || 0));
  if (isNaN(num)) return '₹ 0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const getTodayDate = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateDueDate = (dateStr: string, creditDays = 0): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return getTodayDate();
    d.setDate(d.getDate() + (Number(creditDays) || 0));
    return d.toISOString().split('T')[0];
  } catch {
    return getTodayDate();
  }
};

export const calculateRemainingDays = (dueDateStr: string): number => {
  try {
    const today = new Date(getTodayDate() + 'T00:00:00');
    const due = new Date(dueDateStr + 'T00:00:00');
    if (isNaN(due.getTime())) return 0;
    const diffTime = due.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
};

export const generateTripNumber = (dateStr?: string, existingTrips: { trip_no: string }[] = []): string => {
  const baseDate = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  const yy = String(baseDate.getFullYear()).slice(-2);
  const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
  const dd = String(baseDate.getDate()).padStart(2, '0');
  const base = `TRP-${yy}${mm}${dd}`;

  const prefix = `${base}-`;
  const usedCounters = new Set(
    existingTrips
      .map(t => String(t.trip_no || ''))
      .filter(no => no.startsWith(prefix))
      .map(no => parseInt(no.slice(prefix.length), 10))
      .filter(n => !isNaN(n) && n > 0)
  );

  let counter = 1;
  while (usedCounters.has(counter)) {
    counter++;
  }

  return `${base}-${String(counter).padStart(2, '0')}`;
};

export const generateInvoiceNumber = (existingInvoices: { invoice_no: string }[] = []): string => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const base = `INV-${yy}${mm}${dd}`;

  let candidate: string;
  let attempts = 0;
  do {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    candidate = `${base}-${randomSuffix}`;
    attempts++;
  } while (existingInvoices.some(i => i.invoice_no === candidate) && attempts < 100);

  return candidate;
};

export const numberToWords = (num: number): string => {
  if (num === 0) return 'Rupees Zero Only';
  const floorVal = Math.floor(num);
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  return 'Rupees ' + convert(floorVal).trim() + ' Only';
};
