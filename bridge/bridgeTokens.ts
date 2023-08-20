export type BridgeToken = {
  address: string;
  makerAddress: string;
  precision: number;
  id: number;
  name: string;
  chainId: number;
}

export const BRIDGE_TOKENS: BridgeToken[] = [
  {
    address: "0x0000000000000000000000000000000000000000",
    makerAddress: "0x80C67432656d59144cEFf962E8fAF8926599bCF8",
    precision: 18,
    id: 0,
    name: "ETH",
    chainId: 2,
  }
]