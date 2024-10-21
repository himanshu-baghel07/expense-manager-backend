import CryptoJS from "crypto-js";

export const decryptPayload = (encryptedPayload) => {
  const bytes = CryptoJS.AES.decrypt(encryptedPayload, "seceret_key");
  const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decryptedData);
};
