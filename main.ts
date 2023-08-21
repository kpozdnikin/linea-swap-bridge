import * as dotenv from "dotenv";
import BigNumber from "bignumber.js";
import mainConfig from "./mainConfig.json";
import { bridgeEth } from "./bridge";
import { swapTokens } from "./swap";
import { readWalletsFromFile } from "./wallets";
import { delay } from "./utils";
import { EVMBasedAddress } from "./types";

dotenv.config();

async function main() {
  const wallets = readWalletsFromFile("wallet.txt", false); // true for random order

  if (!Array.isArray(wallets)) {
    return { success: false, error: "Wallets list is empty" };
  }

  const amountToTransfer = new BigNumber(mainConfig.amountToTransfer);
  const tokenFromAddress = mainConfig.tokenInAddress as EVMBasedAddress;
  const tokenToAddress = mainConfig.tokenOutAddress as EVMBasedAddress;
  const amount = mainConfig.amountToTransfer;

  for (const privateKey of wallets) {
    // You can either set the contracts here for each wallet or outside the loop if they're the same for all wallets.

    // Шаг 1: Перевод ETH из Arbitrum в Linea
    await bridgeEth(mainConfig.fromChain, mainConfig.toChain, amount, privateKey);

    // Шаг 2: Своп ETH на USDC
    await swapTokens(tokenFromAddress, tokenToAddress, amountToTransfer);

    // Шаг 3: Обратный своп USDC на ETH
    await swapTokens(tokenToAddress, tokenFromAddress, new BigNumber(mainConfig.amountToTransfer));

    // Задержка перед следующим кошельком
    await delay(mainConfig.delayBetweenWallets);
  }
}

main().catch(console.error);
