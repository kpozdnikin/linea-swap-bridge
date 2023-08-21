import BigNumber from "bignumber.js";
import { providers } from "ethers";
import { EVMBasedAddress } from "../types";
import { SwapService } from "./SwapService";
import { zkSyncEraMainnet } from "./config";
import classicPoolFactoryAbi from "./syncSwapClassicPoolFactory.json";
import syncSwapPoolMaster from "./syncSwapPoolMaster.json";

const provider = new providers.JsonRpcProvider(/*... ваш URL RPC ...*/);
const signer = provider.getSigner();

const swapServiceInstance = new SwapService(
  provider,
  signer,
  zkSyncEraMainnet.syncSwapClassicPoolFactory, // classicPoolFactoryAddress,
  classicPoolFactoryAbi,
  syncSwapPoolMaster, // poolAbi,
  zkSyncEraMainnet.syncSwapRouter, // routerAddress,
  classicPoolFactoryAbi, // routerAbi,
);

export const swapTokens = async (
  tokenInAddress: EVMBasedAddress,
  tokenOutAddress: EVMBasedAddress,
  value: BigNumber,
) => {
  try {
    const result = await swapServiceInstance.swapTokens(tokenInAddress, tokenOutAddress, value);
    console.log("swapTokens result", result);

    return { success: true, result };
  } catch (error) {
    console.error("swapTokens failed:", error);
    return { success: false, error };
  }
};