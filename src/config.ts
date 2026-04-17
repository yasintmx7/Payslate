import { http, createConfig } from 'wagmi'
import { mainnet, base } from 'wagmi/chains'
import { defineChain } from 'viem'

export const ARC_CHAIN_ID = 5042002
export const CONTRACT_ADDRESS = '0x6C6A7cd25542b31966eEE40f2dfca966de40E707' as `0x${string}`

export const arcTestnet = defineChain({
  id: ARC_CHAIN_ID,
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
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
    [mainnet.id]:    http(),
    [base.id]:       http(),
  },
})

