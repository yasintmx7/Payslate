import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'

export const ARC_CHAIN_ID = 5042002
export const CONTRACT_ADDRESS = '0x6C6A7cd25542b31966eEE40f2dfca966de40E707' as `0x${string}`

// USDC uses 6 decimals — not 18 like ETH
export const USDC_DECIMALS = 6

export const arcTestnet = defineChain({
  id: ARC_CHAIN_ID,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: USDC_DECIMALS, // ✅ Fixed: USDC is 6 decimals
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

// Only Arc — removed unused mainnet/base to reduce bundle size
export const config = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
  },
})
