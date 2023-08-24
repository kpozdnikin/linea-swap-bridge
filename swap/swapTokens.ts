import BigNumber from "bignumber.js";
import { ethers, Wallet } from "ethers";
import { EVMBasedAddress } from "../types";
import { SwapService } from "./SwapService";
import { LINEA_MAINNET_CONTRACTS, LINEA_MAINNET_RPC } from "./config";
import classicPoolFactoryAbi from "./syncSwapClassicPoolFactoryAbi.json";
import syncSwapRouterAbi from "./syncSwapRouterAbi.json";
import syncSwapPoolAbi from "./syncSwapPoolAbi.json";

export const swapTokens = async (
  tokenInAddress: EVMBasedAddress,
  tokenOutAddress: EVMBasedAddress,
  value: BigNumber,
  privateKey: string,
) => {
  const provider = new ethers.providers.JsonRpcProvider({
    url: LINEA_MAINNET_RPC,
  });
  const wallet = new Wallet(privateKey);
  const signer = wallet.connect(provider);

  console.log("signer", signer, "provider", provider);

  try {
    const swapServiceInstance = new SwapService(
      provider,
      signer,
      LINEA_MAINNET_CONTRACTS.syncSwapClassicPoolFactory, // classicPoolFactoryAddress,
      classicPoolFactoryAbi,
      syncSwapPoolAbi,
      LINEA_MAINNET_CONTRACTS.syncSwapRouter, // routerAddress,
      syncSwapRouterAbi, // routerAbi,
    );

    const result = await swapServiceInstance.swapTokens(tokenInAddress, tokenOutAddress, value);

    console.log("swapTokens result", result);

    return { success: true, result };
  } catch (error) {
    console.error("swapTokens failed:", error);
    return { success: false, error };
  }
};
