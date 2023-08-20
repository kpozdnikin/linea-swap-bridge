// Load private keys from wallet.txt
export const loadWallets = () => {
  const fs = require('fs');
  const data = fs.readFileSync('wallet.txt', 'utf-8');

  return data.split('\n').filter((key: string) => key.length === 64); // Assuming each private key is 64 characters long
}