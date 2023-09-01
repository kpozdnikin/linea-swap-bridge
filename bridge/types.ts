import ethers, { BigNumberish } from "ethers";

export type CrossAddressExt = {
  type: string;
  value: string;
};

export type BridgeToken = {
  address: string;
  makerAddress: string;
  precision: number;
  id: number;
  name: string;
  chainId: number;
};

export type ChainConfig = {
  id: number;
  name: string;
  networkId: number;
  mainnet: string;
  testnet?: string;
};

export type ExpandMakerInfo = {
  makerAddress: string;
  fromChainId: number;
  toChainId: number;
  fromChainName: string;
  toChainName: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  tokenName: string;
  minPrice: number;
  maxPrice: number;
  precision: number;
  avalibleDeposit: number;
  tradingFee: number;
  gasFee: number;
  avalibleTimes: Array<{ startTime: number; endTime: number }>;
};

export type BridgeChain = {
  id: number; // Orbiter's chainId
  name: string;
  networkId: number | string;
  icon?: string;
};

export type TransactionTransferOptions = {
  amount: ethers.BigNumberish;
  tokenAddress: string;
  toAddress: string;

  defaultGasLimit?: BigNumberish; // For evm, default value is 55000
  fromAddress?: string;
  decimals?: number; // For immutableX, docs: https://docs.x.immutable.com/docs/linktransfer
  symbol?: string; // For immutableX
  memo?: string; // For loopring
  receiverPublicKey?: string; // For dydx, docs: https://docs.dydx.exchange/#create-transfer
  receiverPositionId?: string; // For dydx
  clientIdAddress?: string; // For dydx, default is toAddress
  nonce?: number; // For customize
  maxFee?: BigNumberish;

  crossAddressExt?: CrossAddressExt; // Cross address transfer data
};
