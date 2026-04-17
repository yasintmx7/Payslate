import { http, createConfig } from 'wagmi'
import { mainnet, base } from 'wagmi/chains'
import { defineChain } from 'viem'

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
})

export const config = createConfig({
  chains: [arcTestnet, mainnet, base],
  transports: {
    [arcTestnet.id]: http(),
    [mainnet.id]: http(),
    [base.id]: http(),
  },
})
