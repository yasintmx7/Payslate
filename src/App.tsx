import React, { useState, useEffect, useCallback } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from 'wagmi'
import { injected } from 'wagmi/connectors'
import { parseEther, formatEther, keccak256, toHex, decodeEventLog, isAddress } from 'viem'
import { ARC_INVOICE_ABI } from './abi'
import { CONTRACT_ADDRESS, ARC_CHAIN_ID } from './config'
import {
  Wallet,
  Plus,
  CheckCircle,
  ExternalLink,
  Copy,
  ChevronLeft,
  Loader2,
  Info,
  ShieldCheck,
  FileText,
  Clock,
  Receipt,
  Droplet,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'

// ─── Constants ───────────────────────────────────────────────────────────────
const historyKey = (address: string) => `arc_invoice_history_${address.toLowerCase()}`
const ZERO_ADDR   = '0x0000000000000000000000000000000000000000'

// ─── Types ───────────────────────────────────────────────────────────────────
interface InvoiceRecord {
  id: string
  hash: string
  amount: string
  note: string
  date: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getHistory(address: string): InvoiceRecord[] {
  try {
    return JSON.parse(localStorage.getItem(historyKey(address)) || '[]')
  } catch {
    return []
  }
}

function saveInvoice(record: InvoiceRecord, address: string): void {
  const history = getHistory(address)
  if (!history.find((h) => h.id === record.id)) {
    history.unshift(record)
    localStorage.setItem(historyKey(address), JSON.stringify(history))
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

/** Safely parse any string → BigInt. Returns 0n on failure. */
function safeBigInt(val: string | undefined): bigint {
  try {
    return val ? BigInt(val) : 0n
  } catch {
    return 0n
  }
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const { address, isConnected } = useAccount()
  const { connect }  = useConnect()
  const { disconnect } = useDisconnect()
  const chainId      = useChainId()
  const { switchChain } = useSwitchChain()
  const isWrongNetwork = isConnected && chainId !== ARC_CHAIN_ID

  return (
    <nav className="nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link to="/" className="nav-logo">Arc Invoice</Link>
        <span className="badge-testnet">TESTNET</span>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        {/* Faucet — always visible */}
        <a
          href="https://faucet.circle.com"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Droplet size={14} color="var(--accent)" /> Faucet
        </a>

        {isWrongNetwork && (
          <button
            onClick={() => switchChain({ chainId: ARC_CHAIN_ID })}
            className="btn-danger"
          >
            Switch to Arc
          </button>
        )}

        {isConnected ? (
          <>
            <Link to="/my-invoices" className="nav-link">My Invoices</Link>
            <button onClick={() => disconnect()} className="btn-ghost">
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </button>
          </>
        ) : (
          <button
            onClick={() => connect({ connector: injected() })}
            className="btn-primary btn-sm"
          >
            <Wallet size={16} /> Connect
          </button>
        )}
      </div>
    </nav>
  )
}

// ─── Landing ─────────────────────────────────────────────────────────────────
function Landing() {
  return (
    <div className="container hero-container">
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-title"
      >
        On-chain USDC <span className="accent">invoices.</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="hero-sub"
      >
        Create shareable payment links on Arc Network.
        Fast, irreversible, and crystal clear.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link to="/create" className="btn-primary btn-lg">
          <Plus size={20} /> Create Invoice
        </Link>
      </motion.div>

      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon" style={{ background: 'var(--accent-glow)' }}>
            <Wallet size={18} color="var(--accent)" />
          </div>
          <h3>Native USDC</h3>
          <p>Gas and payments in native USDC. One token, simple fees.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <CheckCircle size={18} color="var(--success)" />
          </div>
          <h3>Instant Finality</h3>
          <p>Settled in under 1 second. Faster than any credit card.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <FileText size={18} color="var(--warning)" />
          </div>
          <h3>Share Anywhere</h3>
          <p>Clean payment links and scannable QR codes on every invoice.</p>
        </div>
      </div>
    </div>
  )
}

// ─── CreateInvoice ───────────────────────────────────────────────────────────
function CreateInvoice() {
  const { isConnected, address } = useAccount()
  const navigate       = useNavigate()
  const chainId        = useChainId()
  const isWrongNetwork = isConnected && chainId !== ARC_CHAIN_ID

  const [amount,      setAmount]      = useState('')
  const [note,        setNote]        = useState('')
  const [expiryDays,  setExpiryDays]  = useState('7')
  const [redirecting, setRedirecting] = useState(false)

  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract()

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash })

  /**
   * Parse the InvoiceCreated event from the transaction receipt.
   * Filters strictly by CONTRACT_ADDRESS so we get OUR event.
   */
  const parseInvoiceId = useCallback((): string | null => {
    if (!receipt) return null

    for (const log of receipt.logs) {
      // Only look at logs emitted by our contract
      if (log.address.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) continue

      try {
        const decoded = decodeEventLog({
          abi: ARC_INVOICE_ABI,
          data: log.data,
          topics: log.topics,
          strict: false,
        })
        if (decoded.eventName === 'InvoiceCreated' && decoded.args) {
          // @ts-ignore – invoiceId is uint256 bigint
          const invoiceId = decoded.args.invoiceId
          if (invoiceId !== undefined) return invoiceId.toString()
        }
      } catch {
        continue
      }
    }
    return null
  }, [receipt])

  useEffect(() => {
    if (!isSuccess || !receipt || redirecting) return
    const id = parseInvoiceId()
    if (!id) return   // no valid ID found — don't redirect to garbage
    if (!address) return

    setRedirecting(true)
    saveInvoice({
      id,
      hash: receipt.transactionHash,
      amount,
      note,
      date: Date.now(),
    }, address)
    navigate(`/invoice/${id}`)
  }, [isSuccess, receipt, redirecting, parseInvoiceId, amount, note, address, navigate])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected) return alert('Please connect your wallet first.')
    if (isWrongNetwork) return alert('Please switch to Arc Testnet.')
    if (!amount || parseFloat(amount) <= 0) return alert('Enter a valid amount.')

    const expiryTs = BigInt(Math.floor(Date.now() / 1000) + parseInt(expiryDays) * 86400)
    const noteHash = keccak256(toHex(note))

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ARC_INVOICE_ABI,
      functionName: 'createInvoice',
      // ABI: amount(uint256), expiry(uint64), noteHash(bytes32), note(string)
      args: [parseEther(amount), expiryTs, noteHash, note],
    })
  }

  const txError = writeError || receiptError

  return (
    <div className="container">
      <Link to="/" className="back-link">
        <ChevronLeft size={16} /> Back
      </Link>
      <div className="card">
        <h2 className="section-title">New Invoice</h2>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="field">
            <label>Amount (USDC)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isPending || isConfirming}
            />
          </div>

          {address && (
            <div className="info-box">
              <Info size={14} color="var(--accent)" />
              <span>Funds will be sent directly to <code>{address.slice(0,8)}…{address.slice(-6)}</code></span>
            </div>
          )}

          <div className="field">
            <label>Invoice Note</label>
            <textarea
              placeholder="e.g. Design work for March"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              disabled={isPending || isConfirming}
              rows={3}
            />
          </div>

          <div className="field">
            <label>Expires In</label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              disabled={isPending || isConfirming}
            >
              <option value="1">1 Day</option>
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>

          {txError && (
            <div className="error-box">
              {(txError as Error).message?.slice(0, 180) ?? 'Transaction failed'}
            </div>
          )}

          {(isPending || isConfirming || redirecting) && (
            <div className="status-box">
              <Loader2 size={16} className="spin" />
              {redirecting
                ? 'Invoice created! Redirecting…'
                : isConfirming
                ? 'Waiting for confirmation…'
                : 'Confirm in your wallet…'}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isWrongNetwork || isPending || isConfirming || redirecting}
              style={{ flex: 1 }}
            >
              {isWrongNetwork ? 'Switch to Arc' : 'Create Invoice'}
            </button>
            {(writeError || receiptError) && (
              <button type="button" onClick={reset} className="btn-ghost">
                Retry
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── InvoiceDetail ───────────────────────────────────────────────────────────
function InvoiceDetail() {
  const { id }     = useParams<{ id: string }>()
  const { isConnected } = useAccount()
  const chainId    = useChainId()
  const isWrongNetwork = isConnected && chainId !== ARC_CHAIN_ID
  const [copied, setCopied] = useState(false)

  // BUG FIX: safeBigInt prevents BigInt() crash on malformed URL params
  const invoiceId = safeBigInt(id)
  const shareLink = `${window.location.origin}/invoice/${id}`

  const { data, isLoading, isError, isSuccess } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ARC_INVOICE_ABI,
    functionName: 'getInvoice',
    args: [invoiceId],
    query: {
      enabled: invoiceId > 0n,   // skip fetch for 0 / invalid IDs
      retry: 1,
      retryDelay: 1000,
    },
  })

  const {
    writeContract,
    data: payHash,
    isPending: isPayPending,
  } = useWriteContract()

  const { isLoading: isPayConfirming, isSuccess: isPaid } =
    useWaitForTransactionReceipt({ hash: payHash })

  // BUG FIX: viem returns tuple struct as an object with named keys
  const inv    = data as any
  const seller: string  = inv?.seller ?? ''
  const payer:  string  = inv?.payer  ?? ''
  const amount: bigint  = inv?.amount ?? 0n
  const expiry: bigint  = inv?.expiry ?? 0n
  const paid:   boolean = inv?.paid   ?? false
  const note:   string  = inv?.note   ?? ''

  // Invoice is real if seller is non-zero address
  const exists = isSuccess && isAddress(seller) && seller.toLowerCase() !== ZERO_ADDR

  // ── Guard: loading state ──────────────────────────────────────────────────
  // BUG FIX: only show spinner while a fetch is actually in-flight
  if (isLoading) {
    return (
      <div className="container center-content">
        <Loader2 size={40} className="spin" />
        <p style={{ color: 'var(--text-secondary)', marginTop: '14px', fontSize: '0.9rem' }}>
          Loading invoice…
        </p>
      </div>
    )
  }

  // ── Guard: not found / bad ID ────────────────────────────────────────────
  if (invoiceId === 0n || isError || (isSuccess && !exists)) {
    return (
      <div className="container">
        <Link to="/" className="back-link"><ChevronLeft size={16} /> Home</Link>
        <div className="card center-content" style={{ gap: '16px' }}>
          <div style={{ background: 'rgba(239,68,68,0.1)', padding: '20px', borderRadius: '50%' }}>
            <FileText size={40} color="var(--error)" />
          </div>
          <h2 style={{ fontSize: '1.8rem' }}>Invoice not found</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px' }}>
            Invoice <code>#{id}</code> does not exist on the Arc Network.
          </p>
          <Link to="/" className="btn-ghost" style={{ marginTop: '10px' }}>
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const nowSec     = BigInt(Math.floor(Date.now() / 1000))
  const isExpired  = nowSec > expiry
  const alreadyPaid = paid || isPaid

  const handleCopy = () => {
    copyToClipboard(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePay = () => {
    if (!isConnected) return alert('Please connect your wallet first.')
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ARC_INVOICE_ABI,
      functionName: 'payInvoice',
      args: [invoiceId],
      value: amount,
    })
  }

  return (
    <div className="container">
      <Link to="/" className="back-link"><ChevronLeft size={16} /> Home</Link>
      <div className="card invoice-card">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <p className="label">Payment Request</p>
          <div className="invoice-amount">
            {formatEther(amount)} <span className="amount-unit">USDC</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            {alreadyPaid ? (
              <span className="badge badge-paid"><CheckCircle size={12} /> Paid</span>
            ) : isExpired ? (
              <span className="badge badge-expired"><Clock size={12} /> Expired</span>
            ) : (
              <span className="badge badge-pending">Awaiting Payment</span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="detail-block">
          <div className="detail-row">
            <span className="detail-label">Invoice #</span>
            <span className="detail-value">{id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">From</span>
            <code className="detail-value">{seller.slice(0,10)}…{seller.slice(-8)}</code>
          </div>
          {alreadyPaid && (
            <div className="detail-row">
              <span className="detail-label">Paid by</span>
              <code className="detail-value">{payer.slice(0,10)}…{payer.slice(-8)}</code>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Expires</span>
            <span className="detail-value">{new Date(Number(expiry) * 1000).toLocaleDateString()}</span>
          </div>
          {note && (
            <div className="detail-row" style={{ flexDirection: 'column', gap: '4px' }}>
              <span className="detail-label">Note</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{note}</span>
            </div>
          )}
        </div>

        {/* Share Link */}
        <div className="share-block">
          <p className="label" style={{ marginBottom: '8px' }}>Payment Link</p>
          <div className="share-row">
            <input readOnly value={shareLink} style={{ flex: 1, fontSize: '0.8rem' }} />
            <button onClick={handleCopy} className="btn-ghost btn-sm">
              <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <div className="qr-wrapper">
            <QRCodeSVG value={shareLink} size={160} />
          </div>
          <p className="label" style={{ marginTop: '8px' }}>Scan to pay on mobile</p>
        </div>

        {/* Security Badge */}
        <div className="security-box">
          <ShieldCheck size={16} color="var(--success)" />
          <div>
            <strong style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Secure On-Chain Payment</strong>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Non-custodial · ReentrancyGuard protected · Atomic settlement
            </p>
          </div>
        </div>

        {/* Pay Button */}
        {!alreadyPaid && !isExpired && (
          <button
            onClick={handlePay}
            className="btn-primary"
            disabled={isWrongNetwork || isPayPending || isPayConfirming}
            style={{ marginTop: '20px' }}
          >
            {isPayPending || isPayConfirming ? (
              <><Loader2 size={16} className="spin" /> Confirming…</>
            ) : isWrongNetwork ? (
              'Switch to Arc'
            ) : (
              'Pay with Wallet'
            )}
          </button>
        )}

        {/* Footer Links */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
          <a
            href={`https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost btn-sm"
          >
            <ExternalLink size={13} /> Contract
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── MyInvoices ──────────────────────────────────────────────────────────────
function MyInvoices() {
  const { address, isConnected } = useAccount()
  const [history, setHistory] = useState<InvoiceRecord[]>([])
  const [copied,  setCopied]  = useState<string | null>(null)

  useEffect(() => {
    if (address) {
      setHistory(getHistory(address))
    } else {
      setHistory([])
    }
  }, [address])

  const handleCopy = (id: string) => {
    copyToClipboard(`${window.location.origin}/invoice/${id}`)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!isConnected) {
    return (
      <div className="container">
        <Link to="/" className="back-link"><ChevronLeft size={16} /> Dashboard</Link>
        <div className="empty-state">
          <Wallet size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>Connect your wallet to view your invoices.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <Link to="/" className="back-link"><ChevronLeft size={16} /> Dashboard</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>My Invoices</h2>
        <Link to="/create" className="btn-primary btn-sm">
          <Plus size={14} /> New
        </Link>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <Receipt size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>No invoices yet.</p>
          <Link to="/create" className="btn-primary btn-sm" style={{ marginTop: '12px' }}>
            Create your first invoice
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {history.map((inv) => (
            <div key={inv.id} className="invoice-row card">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '1rem' }}>{inv.amount} USDC</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {inv.note || '—'}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {new Date(inv.date).toLocaleDateString()} · #{inv.id}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <button onClick={() => handleCopy(inv.id)} className="btn-ghost btn-sm">
                  <Copy size={13} /> {copied === inv.id ? 'Copied!' : 'Link'}
                </button>
                <Link to={`/invoice/${inv.id}`} className="btn-ghost btn-sm">View</Link>
                <a
                  href={`https://testnet.arcscan.app/tx/${inv.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost btn-sm"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer">
      <p>Built on <strong>Arc</strong> by Circle</p>
      <div className="footer-links">
        <a href="https://docs.arc.network" target="_blank" rel="noopener noreferrer">Docs</a>
        <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer">Explorer</a>
        <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer">Faucet</a>
      </div>
    </footer>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/"            element={<Landing />} />
            <Route path="/create"      element={<CreateInvoice />} />
            <Route path="/invoice/:id" element={<InvoiceDetail />} />
            <Route path="/my-invoices" element={<MyInvoices />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
