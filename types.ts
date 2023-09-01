export type EVMBasedAddress = `0x${string}`;
export type ChainName = "ARBITRUM" | "LINEA";
export type ChainSwapConfig = {
  chainId: number;
  mainnetRpc: string;
  mainnetContracts: {
    syncSwapClassicPoolFactory: EVMBasedAddress;
    syncSwapRouter: EVMBasedAddress;
  };
  tokenAddresses: {
    WETH: EVMBasedAddress;
    USDC: EVMBasedAddress;
  };
};

// TODO - replace ANY
export type OperationResult = {
  success: boolean;
  error?: string;
  result?: any;
};
