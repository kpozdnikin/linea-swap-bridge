export type BridgeToken = {
  address: string;
  makerAddress: string;
  precision: number;
  id: number;
  name: string;
  chainId: number;
  identificationCode: number;
};

export type ChainConfig = {
  id: number;
  name: string;
  networkId: number;
  mainnet: string;
  testnet?: string;
};
