import fs from "fs";

// Load private keys from wallet.txt
export const readWalletsFromFile = (filePath: string, randomOrder: boolean): string[] => {
  const content = fs.readFileSync(filePath, "utf-8");
  const wallets = content.trim().split("\n").map((wallet) => wallet.replace(/\r$/, ''));

  if (randomOrder) {
    for (let i = wallets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wallets[i], wallets[j]] = [wallets[j], wallets[i]]; // ES6 swap
    }
  }

  return wallets;
};
