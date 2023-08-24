import BigNumber from "bignumber.js";
import { ethers, Wallet } from "ethers";
import { EVMBasedAddress } from "../types";
import { SwapService } from "./SwapService";
import { CHAINS_TOKENS_CONFIG } from "./config";
import classicPoolFactoryAbi from "./syncSwapClassicPoolFactoryAbi.json";
import syncSwapRouterAbi from "./syncSwapRouterAbi.json";
import syncSwapPoolAbi from "./syncSwapPoolAbi.json";

export const swapTokens = async (
  chainName,
  tokenInAddress: EVMBasedAddress,
  tokenOutAddress: EVMBasedAddress,
  value: BigNumber,
  privateKey: string,
) => {
  const targetChain = CHAINS_TOKENS_CONFIG[chainName];

  if (!targetChain) {
    return { success: false, error: "Chain not exists" };
  }

  const provider = new ethers.providers.JsonRpcProvider({
    url: targetChain.mainnetRpc,
  });
  const wallet = new Wallet(privateKey);
  const signer = wallet.connect(provider);
  const address = wallet.address as EVMBasedAddress;

  console.log("signer", signer, "provider", provider, "address", address);

  try {
    const swapServiceInstance = new SwapService(
      provider,
      signer,
      address,
      targetChain.mainnetContracts.syncSwapClassicPoolFactory, // classicPoolFactoryAddress,
      classicPoolFactoryAbi,
      syncSwapPoolAbi,
      targetChain.mainnetContracts.syncSwapRouter, // routerAddress,
      syncSwapRouterAbi, // routerAbi,
      targetChain.tokenAddresses.WETH,
    );

    const result = await swapServiceInstance.swapTokens(tokenInAddress, tokenOutAddress, value);

    console.log("swapTokens result", result);

    return { success: true, result };
  } catch (error) {
    console.error("swapTokens failed:", error);
    return { success: false, error };
  }
};
