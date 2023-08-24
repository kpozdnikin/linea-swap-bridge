import { ethers } from "ethers";
import { delay } from "../utils";
import { Bridge } from "./src/bridge";
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

// TODO - show amounts and fee
export const bridgeEth = async (fromChainName: string, toChainName: string, amount: string, privateKey: string) => {
  const fromChain = CHAIN_CONFIG[fromChainName];
  const toChain = CHAIN_CONFIG[toChainName];

  if (!fromChain || !toChain) {
    return { success: false, error: "Invalid chain names provided" };
  }

  console.log("fromChain", fromChain, "toChain", toChain);

  const token = BRIDGE_TOKENS.find((item) => item.name === "ETH");

  if (!token) {
    return { success: false, error: "Invalid token provided" };
  }

  try {
    const providerFrom = new ethers.providers.JsonRpcProvider(fromChain.mainnet);
    const walletFrom = new ethers.Wallet(privateKey, providerFrom);
    const signerFrom = walletFrom.connect(providerFrom);
    const providerTo = new ethers.providers.JsonRpcProvider(toChain.mainnet);
    const walletTo = new ethers.Wallet(privateKey, providerFrom);
    const signerTo = walletTo.connect(providerTo);
    const bridge = new Bridge("Mainnet"); // Testnet
    const result = await bridge.transfer(signerFrom, token, fromChain, toChain, amount);
    const amounts = await bridge.getAmounts(token, fromChain, toChain, amount);

    console.log("amounts to transfer", amounts);

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
