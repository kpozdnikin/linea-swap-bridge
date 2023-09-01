import { ChainSwapConfig } from "../types";

export const CHAINS_TOKENS_CONFIG: Record<string, ChainSwapConfig> = {
  LINEA: {
    chainId: 59140,
    mainnetRpc: "https://rpc.linea.build",
    mainnetContracts: {
      syncSwapClassicPoolFactory: "0x37BAc764494c8db4e54BDE72f6965beA9fa0AC2d",
      syncSwapRouter: "0x80e38291e06339d10AAB483C65695D004dBD5C69",
    },
    tokenAddresses: {
      WETH: "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f",
      USDC: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
    },
  },
};
