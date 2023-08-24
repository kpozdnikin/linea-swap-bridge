import type { ChainConfig } from "./types";

export const CHAIN_CONFIG: Record<string, ChainConfig> = {
  // https://arb-mainnet.g.alchemy.com/v2/QQDRRXo2O1fk5zBDWoQ4xf-IoF9l3Q2w
  ARBITRUM: {
    id: 2,
    name: "arbitrum",
    networkId: 42161,
    mainnet: "https://arb1.arbitrum.io/rpc",
    testnet: "https://api-testnet.arbiscan.io/api",
  },
  OPTIMISM: {
    id: 7,
    name: "optimism",
    networkId: 10,
    mainnet: "https://opt-mainnet.g.alchemy.com/v2/GDHuWPfKx_4cPuycQNl3-9gjQGCfsi24",
    testnet: "https://goerli.optimism.io",
  },
  // https://rpc.linea.build/
  LINEA: {
    id: 23,
    name: "linea",
    networkId: 59140,
    mainnet: "https://linea-mainnet.infura.io/v3",
    testnet: "https://rpc.goerli.linea.build",
  },
  // Добавьте другие сети при необходимости
};
