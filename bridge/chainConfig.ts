export type ChainConfig = {
  id: number;
  name: string;
  networkId: number;
  mainnet: string;
  testnet?: string;
}

export const CHAIN_CONFIG: Record<string, ChainConfig> = {
  ARBITRUM: {
    id: 2,
    name: 'arbitrum',
    networkId: 42161,
    mainnet: 'https://api.arbiscan.io/api',
    testnet:  'https://api-testnet.arbiscan.io/api',
  },
  LINEA: {
    id: 34,
    name: 'linea',
    networkId: 59140,
    mainnet: 'https://linea-mainnet.infura.io/v3',
    testnet:  'https://rpc.goerli.linea.build',
  }
  // Добавьте другие сети при необходимости
};