import { ethers } from "ethers";
import { Bridge } from "orbiter-sdk";
import { delay } from "../utils";
import { CHAIN_CONFIG } from "./config";
import { BRIDGE_TOKENS } from "./constants";

async function waitForBridgeCompletion(destinationWallet: ethers.Wallet, expectedAmount: ethers.BigNumber) {
  let timeout = 1000 * 60 * 60; // 1 hour in milliseconds

  const checkInterval = 1000 * 60; // Check every 1 minute

  while (timeout > 0) {
    const balance = await destinationWallet.getBalance();
    if (balance.gte(expectedAmount)) {
      console.log("Tokens successfully bridged!");

      return;
    }

    await delay(checkInterval);

    timeout -= checkInterval;
  }

  throw new Error("Timed out waiting for tokens to bridge");
}

export const bridgeEth = async (fromChainName: string, toChainName: string, amount: string, privateKey: string) => {
  const fromChain = CHAIN_CONFIG[fromChainName];
  const toChain = CHAIN_CONFIG[toChainName];

  if (!fromChain || !toChain) {
    return { success: false, error: "Invalid chain names provided" };
  }

  const token = BRIDGE_TOKENS.find((item) => item.name === "ETH" && item.chainId === fromChain.networkId);

  if (!token) {
    return { success: false, error: "Invalid token provided" };
  }

  try {
    const providerFrom = new ethers.providers.JsonRpcProvider(fromChain.mainnet);
    const signerFrom = new ethers.Wallet(privateKey, providerFrom);
    const providerTo = new ethers.providers.JsonRpcProvider(toChain.mainnet);
    const signerTo = new ethers.Wallet(privateKey, providerTo);

    const bridge = new Bridge("Testnet"); // Mainnet
    const result = await bridge.transfer(signerFrom, token, fromChain, toChain, amount);

    // Ожидание завершения перехода по мосту
    // передаем signer сети назначения
    await waitForBridgeCompletion(signerTo, ethers.utils.parseEther(amount));

    console.log("Transfer successful:", result);

    return { success: true, result };
  } catch (error) {
    console.error("Transfer failed:", error);

    return { success: false, error };
  }
};
