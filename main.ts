import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import config from './config.json';
import {bridgeFromArbitrumToLinea, performSwap} from "./swapAndBridge";

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const syncSwapContract = new ethers.Contract(config.syncSwapAddress, syncSwapAbi, wallet);
const bridgeContract = new ethers.Contract(config.bridgeContractAddress, bridgeAbi, wallet);

async function main() {
  await bridgeFromArbitrumToLinea(ethers.utils.parseEther('1'));
  await performSwap('1', '3000', config.tokens.ETH, config.tokens.USDC);
  await performSwap('3000', '1', config.tokens.USDC, config.tokens.ETH);
}

main().catch(console.error);