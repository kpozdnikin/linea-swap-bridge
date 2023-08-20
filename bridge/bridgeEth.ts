import { ethers } from 'ethers';
import { Bridge } from 'orbiter-sdk';
import { CHAIN_CONFIG } from "./chainConfig";
import { BRIDGE_TOKENS } from "./bridgeTokens";
const PROVIDER_URL = "";

export const bridgeEth = async (fromChainName: string, toChainName: string, amount: ethers.BigNumber, privateKey: string) => {
  const fromChain = CHAIN_CONFIG[fromChainName];
  const toChain = CHAIN_CONFIG[fromChainName];

  if (!fromChain || !toChain) {
    return { success: false, error: "Invalid chain names provided" };
  }

  const token = BRIDGE_TOKENS.find((item) => item.name === "ETH" && item.chainId === fromChain.networkId)

  if (!token) {
    return { success: false, error: "Invalid token provided" };
  }

  const provider =  new ethers.providers.JsonRpcProvider(PROVIDER_URL);
  const signer = new ethers.Wallet(privateKey, provider);

  const bridge = new Bridge('Testnet'); // Mainnet

  try {
    const result = await bridge.transfer(
      signer,
      token,
      fromChain,
      toChain,
      amount.toString()
    );

    console.log('Transfer successful:', result);
  } catch (error) {
    console.error('Transfer failed:', error);
  }
}
