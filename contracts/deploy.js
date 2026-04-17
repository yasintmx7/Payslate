// Script: deploy.js
// Run with: node contracts/deploy.js
//
// Requirements:
//   npm install ethers
//   Set PRIVATE_KEY env variable before running

const { ethers } = require('ethers')

// ── Config ────────────────────────────────────────────────────────────────────
const RPC_URL    = 'https://rpc.testnet.arc.network'
const PRIVATE_KEY = process.env.PRIVATE_KEY  // never hardcode this

if (!PRIVATE_KEY) {
  console.error('❌  Set PRIVATE_KEY environment variable first.')
  console.error('    Example: $env:PRIVATE_KEY="0xYOUR_KEY" (PowerShell)')
  process.exit(1)
}

// ── ABI + Bytecode ─────────────────────────────────────────────────────────────
// Compile the contract first, then paste the bytecode below.
// You can compile with: npx solc --bin --abi contracts/ArcInvoice.sol
//
// OR deploy directly via Remix IDE at https://remix.ethereum.org :
//  1. Paste ArcInvoice.sol
//  2. Install OpenZeppelin: "npm install @openzeppelin/contracts" in Remix
//  3. Compile with Solidity 0.8.20
//  4. In Deploy tab → select "Injected Provider - MetaMask"
//  5. Set network to Arc Testnet in MetaMask
//  6. Click Deploy — copy the contract address
//  7. Update CONTRACT_ADDRESS in src/config.ts

console.log('ℹ️  Deploy via Remix IDE for easiest setup:')
console.log('   https://remix.ethereum.org')
console.log()
console.log('Steps:')
console.log('  1. Create ArcInvoice.sol in Remix and paste your contract code')
console.log('  2. Install dependency: @openzeppelin/contracts')
console.log('  3. Compile with Solidity 0.8.20')
console.log('  4. Deploy tab → Environment: Injected Provider (MetaMask)')
console.log('  5. Switch MetaMask to Arc Testnet (Chain ID: 5042002)')
console.log('     RPC: https://rpc.testnet.arc.network')
console.log('  6. Click Deploy and confirm in MetaMask')
console.log('  7. Copy the new contract address')
console.log('  8. Update CONTRACT_ADDRESS in src/config.ts')
console.log('  9. Commit and push')
