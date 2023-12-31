import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import mainConfig from "./mainConfig.json";
import { bridgeEth } from "./bridge";
import { swapTokens } from "./swap";
import { readWalletsFromFile } from "./wallets";
import { delay } from "./utils";
import { EVMBasedAddress } from "./types";

// В документации информации о linea нет, но каждая сеть имеет ограничения по сумме трансфера
// По аналогии с другими трансферами с Arbitrum будем считать, что minValue = 0.005, maxValue = 5
const MIN_VALUE = 0.005;
const MAX_VALUE = 5;

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

  let wallets: string[];

  try {
    wallets = readWalletsFromFile("wallet.txt", false); // true for random order
  } catch (e) {
    return { success: false, error: "Wallets.txt not exists" };
  }

  if (!Array.isArray(wallets)) {
    return { success: false, error: "Wallets list is empty" };
  }

  console.log("Wallets were read");

  for (const privateKey of wallets) {
    console.log("try wallet");
    // TODO - return the amount we actually received from the bridge
    // Шаг 1: Перевод ETH из Arbitrum в Linea
    const bridgeResult = await bridgeEth(
      mainConfig.fromChain,
      mainConfig.toChain,
      mainConfig.amountToTransfer,
      privateKey,
    );

    console.log("bridge result", bridgeResult);

    if (!bridgeResult.success) {
      return { success: false, error: "Cannot bridge token" };
    }

    // TODO - return the amount in USDC we actually received from the swap
    // Шаг 2: Своп ETH на USDC
    await swapTokens(mainConfig.toChain, tokenFromAddress, tokenToAddress, amountToTransfer, privateKey);

    // TODO - use the amount we received from the prev swap
    // Шаг 3: Обратный своп USDC на ETH
    await swapTokens(mainConfig.toChain, tokenToAddress, tokenFromAddress, amountToTransfer, privateKey);

    // Задержка перед следующим кошельком
    await delay(mainConfig.delayBetweenWallets);
  }

  return { success: true };
}

main().catch(console.error);
