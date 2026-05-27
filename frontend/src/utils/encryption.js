import CryptoJS from 'crypto-js';

// PERHATIAN: Dalam versi production, SECRET_KEY ini JANGAN di-hardcode.
// Ambil dari file .env (misal: import.meta.env.VITE_E2E_SECRET_KEY)
// Kunci ini hanya boleh diketahui oleh pihak yang berwenang (misal: teknisi & supervisor)
const SECRET_KEY = "SakaFarma_Super_Secret_Key_2026"; 

// Fungsi untuk menggembok data (Enkripsi)
export const encryptTicketData = (plainText) => {
    if (!plainText) return "";
    const cipherText = CryptoJS.AES.encrypt(plainText, SECRET_KEY).toString();
    return cipherText;
};

// Fungsi untuk membuka gembok data (Dekripsi)
export const decryptTicketData = (cipherText) => {
    if (!cipherText) return "";
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText;
    } catch (error) {
        console.error("Dekripsi gagal, kemungkinan kunci salah atau data rusak.");
        return "⚠️ Data Terenkripsi (Kunci Tidak Valid)";
    }
};