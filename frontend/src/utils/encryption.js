import CryptoJS from 'crypto-js';

// Demo-only client-side key for Form 4 confidentiality evidence.
// This is not production-grade end-to-end encryption or key management.
const SECRET_KEY = 'SakaFarma_Super_Secret_Key_2026';

export const encryptTicketData = (plainText) => {
  if (!plainText) return '';
  return CryptoJS.AES.encrypt(plainText, SECRET_KEY).toString();
};

export const decryptTicketData = (cipherText) => {
  if (!cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '[Encrypted data - invalid key]';
  }
};
