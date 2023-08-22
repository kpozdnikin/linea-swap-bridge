import * as dotenv from "dotenv";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import mainConfig from "./mainConfig.json";
import { bridgeEth } from "./bridge";
import { swapTokens } from "./swap";
import { readWalletsFromFile } from "./wallets";
import { delay } from "./utils";
import { EVMBasedAddress } from "./types";

dotenv.config();

// В документации информации о linea нет, но каждая сеть имеет ограничения по сумме трансфера
// По аналогии с другими трансферами с Arbitrum будем считать, что minValue = 0.005, maxValue = 5
const MIN_VALUE = 0.005;
const MAX_VALUE = 5;

// ETH - ARBITRUM - 0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8 0.0062 -> 0.005
// ETH - ARBITRUM - 0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8 0.0062 -> 0.005

async function main() {
  if (!ethers.utils.isAddress(mainConfig.tokenInAddress)) {
    return { success: false, error: "Invalid tokenInAddress address" };
  }

  if (!ethers.utils.isAddress(mainConfig.tokenOutAddress)) {
    return { success: false, error: "Invalid tokenOutAddress address" };
  }

  const amountToTransfer = new BigNumber(mainConfig.amountToTransfer);

  if (amountToTransfer.lt(MIN_VALUE) || amountToTransfer.gt(MAX_VALUE)) {
    return { success: false, error: "Invalid token amount" };
  }

  const tokenFromAddress = mainConfig.tokenInAddress as EVMBasedAddress;
  const tokenToAddress = mainConfig.tokenOutAddress as EVMBasedAddress;
  const amount = mainConfig.amountToTransfer;

  const wallets = readWalletsFromFile("wallet.txt", false); // true for random order

  if (!Array.isArray(wallets)) {
    return { success: false, error: "Wallets list is empty" };
  }

  console.log("Wallets were read");

  for (const privateKey of wallets) {
    console.log("try wallet");
    // You can either set the contracts here for each wallet or outside the loop if they're the same for all wallets.

    // Шаг 1: Перевод ETH из Arbitrum в Linea
    await bridgeEth(mainConfig.fromChain, mainConfig.toChain, amount, privateKey);

    // Шаг 2: Своп ETH на USDC
    await swapTokens(tokenFromAddress, tokenToAddress, amountToTransfer, privateKey);

    // Шаг 3: Обратный своп USDC на ETH
    await swapTokens(tokenToAddress, tokenFromAddress, new BigNumber(mainConfig.amountToTransfer), privateKey);

    // Задержка перед следующим кошельком
    await delay(mainConfig.delayBetweenWallets);
  }
}

main().catch(console.error);
