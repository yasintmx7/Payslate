export const ARC_INVOICE_ABI = [
  {
    "type": "function",
    "name": "createInvoice",
    "inputs": [
      { "name": "amount", "type": "uint256", "internalType": "uint256" },
      { "name": "expiry", "type": "uint64", "internalType": "uint64" },
      { "name": "noteHash", "type": "bytes32", "internalType": "bytes32" },
      { "name": "note", "type": "string", "internalType": "string" }
    ],
    "outputs": [{ "name": "invoiceId", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "payInvoice",
    "inputs": [{ "name": "invoiceId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getInvoice",
    "inputs": [{ "name": "invoiceId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      { "name": "seller", "type": "address", "internalType": "address" },
      { "name": "payer", "type": "address", "internalType": "address" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" },
      { "name": "expiry", "type": "uint64", "internalType": "uint64" },
      { "name": "paid", "type": "bool", "internalType": "bool" },
      { "name": "note", "type": "string", "internalType": "string" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "InvoiceCreated",
    "inputs": [
      { "name": "invoiceId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "seller", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "expiry", "type": "uint64", "indexed": false, "internalType": "uint64" },
      { "name": "notePreview", "type": "string", "indexed": false, "internalType": "string" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InvoicePaid",
    "inputs": [
      { "name": "invoiceId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "seller", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "payer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  }
] as const
