const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const CURRENCY_NAMES = {
  INR: 'Rupees', QAR: 'Riyals', USD: 'Dollars', AED: 'Dirhams', GBP: 'Pounds', EUR: 'Euros'
};

function threeDigitsToWords(num) {
  let str = '';
  if (num >= 100) {
    str += ONES[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    str += TENS[Math.floor(num / 10)] + ' ';
    num %= 10;
  }
  if (num > 0) {
    str += ONES[num] + ' ';
  }
  return str.trim();
}

function integerToWords(num) {
  if (num === 0) return 'Zero';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const rest = num;

  const parts = [];
  if (crore) parts.push(threeDigitsToWords(crore) + ' Crore');
  if (lakh) parts.push(threeDigitsToWords(lakh) + ' Lakh');
  if (thousand) parts.push(threeDigitsToWords(thousand) + ' Thousand');
  if (rest) parts.push(threeDigitsToWords(rest));

  return parts.join(' ').trim();
}

// Spells out a currency amount, e.g. 112.50 -> "Rupees One Hundred Twelve and 50/100 Only"
export function amountToWords(amount, currencyCode) {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const whole = Math.floor(rounded);
  const paise = Math.round((rounded - whole) * 100);
  const currencyName = CURRENCY_NAMES[currencyCode] || '';

  let words = integerToWords(whole);
  if (paise > 0) {
    words += ` and ${String(paise).padStart(2, '0')}/100`;
  }

  return `${currencyName ? currencyName + ' ' : ''}${words} Only`.replace(/\s+/g, ' ').trim();
}
