import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { parseEther, formatEther, keccak256, toHex, decodeEventLog } from 'viem'
import { ARC_INVOICE_ABI } from './abi'
import { Wallet, Plus, CheckCircle, ExternalLink, Copy, ChevronLeft, Loader2, CreditCard, Info, ShieldCheck, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'

// REPLACE WITH DEPLOYED CONTRACT ADDRESS
const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890' as const

function Navbar() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const isWrongNetwork = isConnected && chainId !== 5042002

  return (
    <nav className="nav" style={{ padding: '24px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/" className="nav-logo" style={{ textDecoration: 'none', fontSize: '1.4rem' }}>Arc Invoice</Link>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.1em', border: '1px solid var(--border)', transform: 'translateY(-1px)' }}>
          TESTNET
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <a 
          href="https://faucet.circle.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}
        >
          Get USDC
        </a>
        {isWrongNetwork && (
          <button 
            onClick={() => switchChain({ chainId: 5042002 })}
            className="btn-primary" 
            style={{ padding: '8px 16px', width: 'auto', background: 'var(--error)' }}
          >
            Switch to Arc
          </button>
        )}
        {isConnected ? (
          <>
            <Link to="/my-invoices" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>My Invoices</Link>
            <button 
              onClick={() => disconnect()}
              className="glass" 
              style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem', color: 'var(--text-primary)' }}
            >
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </button>
          </>
        ) : (
          <button 
            onClick={() => connect({ connector: injected() })}
            className="btn-primary" 
            style={{ padding: '8px 20px', width: 'auto' }}
          >
            <Wallet size={18} />
            Connect
          </button>
        )}
      </div>
    </nav>
  )
}

function Landing() {
  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-title"
        style={{ fontSize: '3.5rem', marginBottom: '24px', fontWeight: 800 }}
      >
        On-chain dynamic <span style={{ color: 'var(--accent)' }}>invoices</span>.
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '40px' }}
      >
        Create shareable USDC payment links on Arc. Fast, irreversible, and crystal clear.
        <br />
        <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '1rem', textDecoration: 'none', display: 'inline-block', marginTop: '12px' }}>
          Need testnet USDC? Visit the Faucet →
        </a>
      </motion.p>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '80px' }}
      >
        <Link to="/create" className="btn-primary" style={{ width: 'auto', padding: '16px 32px' }}>
          <Plus size={20} />
          Create Invoice
        </Link>
      </motion.div>

      <div className="feature-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '16px', 
        textAlign: 'left',
        marginTop: '60px'
      }}>
        <div className="card glass" style={{ padding: '20px' }}>
          <div style={{ background: 'var(--accent-glow)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <Wallet size={16} color="var(--accent)" />
          </div>
          <h3 style={{ marginBottom: '4px', fontSize: '1rem' }}>Native USDC</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Gas and payments in native USDC. Simple fees.</p>
        </div>
        <div className="card glass" style={{ padding: '20px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <CheckCircle size={16} color="var(--success)" />
          </div>
          <h3 style={{ marginBottom: '4px', fontSize: '1rem' }}>Instant Finality</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Confirmed in under 1s. Faster than credit cards.</p>
        </div>
        <div className="card glass" style={{ padding: '20px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <FileText size={16} color="var(--warning)" />
          </div>
          <h3 style={{ marginBottom: '4px', fontSize: '1rem' }}>Share Anywhere</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Clean invoice links and scannable QR codes.</p>
        </div>
      </div>
    </div>
  )
}

function CreateInvoice() {
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  const [createdInvoiceId, setCreatedInvoiceId] = useState<bigint | null>(null)
  const { writeContract, data: hash, isPending, reset: resetWrite } = useWriteContract()
  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const chainId = useChainId()
  const isWrongNetwork = isConnected && chainId !== 5042002

  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [expiryDays, setExpiryDays] = useState('7')

  // Safely process logs in a side effect
  useEffect(() => {
    if (isSuccess && receipt) {
      const log = receipt.logs.find(l => l.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase())
      if (log) {
        try {
          const decoded = decodeEventLog({
            abi: ARC_INVOICE_ABI,
            eventName: 'InvoiceCreated',
            data: log.data,
            topics: log.topics,
          })
          if (decoded.args && 'invoiceId' in decoded.args) {
            const id = decoded.args.invoiceId as bigint
            if (!createdInvoiceId || createdInvoiceId !== id) {
              const history = JSON.parse(localStorage.getItem('invoice_history') || '[]')
              if (!history.find((h: any) => h.id === id.toString())) {
                history.push({ 
                  hash: receipt.transactionHash, 
                  id: id.toString(), 
                  amount, 
                  note, 
                  date: Date.now() 
                })
                localStorage.setItem('invoice_history', JSON.stringify(history))
                setCreatedInvoiceId(id)
              }
            }
          }
        } catch (e) {
          console.error('Failed to decode log', e)
        }
      }
    }
  }, [isSuccess, receipt, CONTRACT_ADDRESS, amount, note, createdInvoiceId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected) return alert('Please connect wallet')
    const expiry = Math.floor(Date.now() / 1000) + (parseInt(expiryDays) * 24 * 60 * 60)
    const noteHash = keccak256(toHex(note))

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ARC_INVOICE_ABI,
      functionName: 'createInvoice',
      args: [parseEther(amount), BigInt(expiry), noteHash, note],
      chainId: 5042002,
    } as any)
  }

  if (isSuccess && createdInvoiceId) {
    const shareLink = `${window.location.origin}/invoice/${createdInvoiceId}`
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', border: '1px solid var(--success)' }}>
          <CheckCircle size={64} color="var(--success)" style={{ marginBottom: '16px' }} />
          <h2>Invoice Ready!</h2>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', margin: '24px 0', border: '1px solid var(--border)' }}>
            <input readOnly value={shareLink} style={{ textAlign: 'center', marginBottom: '16px' }} />
            <button onClick={() => { navigator.clipboard.writeText(shareLink); alert('Copied!'); }} className="btn-primary">
              <Copy size={18} /> Copy Payment Link
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => navigate(`/invoice/${createdInvoiceId}`)} className="glass">View Invoice</button>
            <button onClick={() => {
              setCreatedInvoiceId(null)
              resetWrite()
              navigate('/create')
            }} className="glass">Create Another</button>
            <button onClick={() => navigate('/my-invoices')} className="glass">History</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', marginBottom: '24px' }}>
        <ChevronLeft size={16} /> Back
      </Link>
      <div className="card">
        <h2 style={{ marginBottom: '24px' }}>New Invoice</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Amount (USDC)</label>
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
          <div className="glass" style={{ padding: '12px', borderRadius: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Info size={16} color="var(--accent)" />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Funds go to: <code>{useAccount().address}</code></p>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Expires In</label>
            <select value={expiryDays} onChange={e => setExpiryDays(e.target.value)}>
              <option value="1">1 Day</option>
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={isWrongNetwork || isPending || isConfirming}>
            {isWrongNetwork ? 'Switch to Arc' : isPending || isConfirming ? 'Processing...' : 'Create Invoice'}
          </button>
        </form>
      </div>
    </div>
  )
}

function InvoiceDetail() {
  const { id } = useParams()
  const { isConnected } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })
  const chainId = useChainId()
  const isWrongNetwork = isConnected && chainId !== 5042002

  const { data: invoiceData, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ARC_INVOICE_ABI,
    functionName: 'getInvoice',
    args: [BigInt(id || '0')],
  })

  const [seller, payer, amount, expiry, paid, note] = (invoiceData as any) || []
  const isExpired = expiry && BigInt(Math.floor(Date.now() / 1000)) > expiry

  const handlePay = () => {
    if (!isConnected) return alert('Please connect wallet')
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ARC_INVOICE_ABI,
      functionName: 'payInvoice',
      args: [BigInt(id || '0')],
      value: amount,
      chainId: 5042002,
    } as any)
  }

  if (isLoading) return <div className="container" style={{ textAlign: 'center' }}><Loader2 className="animate-spin" size={48} /></div>
  if (!seller || seller === '0x0000000000000000000000000000000000000000') return <div className="container"><h2>Invoice not found</h2></div>

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '8px' }}>Payment Request</h2>
        <div style={{ color: 'var(--accent)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '24px' }}>
          {formatEther(amount)} <span style={{ fontSize: '1.2rem', opacity: 0.8 }}>USDC</span>
        </div>

        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>Details</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Seller: <code style={{ fontSize: '0.75rem' }}>{seller}</code></p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Expires: {new Date(Number(expiry) * 1000).toLocaleString()}</p>
          <p style={{ fontSize: '1rem', color: 'white', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>{note}</p>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '12px' }}>
            <QRCodeSVG value={window.location.href} size={150} />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scan to pay</p>
        </div>

        <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '32px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', marginBottom: '8px' }}>
            <ShieldCheck size={18} />
            <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>SECURE ARC PAYMENT</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Verifying on-chain transaction integrity...</p>
        </div>

        {paid ? (
          <div className="badge badge-paid" style={{ padding: '16px', fontSize: '1rem' }}>Payment Confirmed (Payer: {payer.slice(0,6)}...)</div>
        ) : isExpired ? (
          <div className="badge badge-expired" style={{ padding: '16px', fontSize: '1rem' }}>Invoice Expired</div>
        ) : (
          <button onClick={handlePay} className="btn-primary" disabled={isWrongNetwork || isPending || isConfirming}>
            {isWrongNetwork ? 'Switch to Arc' : isPending || isConfirming ? 'Confirming...' : 'Pay with Wallet'}
          </button>
        )}

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Copied!'); }} className="glass" style={{ fontSize: '0.8rem' }}>
            <Copy size={14} /> Copy Link
          </button>
          <a href={`https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="glass" style={{ fontSize: '0.8rem', textDecoration: 'none' }}>
            <ExternalLink size={14} /> View Contract
          </a>
        </div>
      </div>
    </div>
  )
}

function MyInvoices() {
  const getHistory = () => {
    const keys = ['invoice_history', 'paynote_history', 'arc_invoices']
    let combined: any[] = []
    keys.forEach(k => {
      const d = JSON.parse(localStorage.getItem(k) || '[]')
      if (Array.isArray(d)) combined = [...combined, ...d]
    })
    // deduplicate
    return combined.reduce((acc: any[], curr: any) => {
      if (!acc.find(h => h.id === curr.id)) acc.push(curr)
      return acc
    }, []).sort((a: any, b: any) => b.date - a.date)
  }

  const history = getHistory()
  return (
    <div className="container">
      <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', marginBottom: '24px' }}>
        <ChevronLeft size={16} /> Back to Dashboard
      </Link>
      <h2 style={{ marginBottom: '24px' }}>My Invoices</h2>
      {history.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((h: any, i: number) => (
            <div key={i} className="card glass" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600 }}>{h.amount} USDC</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{h.note}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/invoice/${h.id}`); alert('Copied!'); }} style={{ background: 'none', color: 'var(--accent)', fontSize: '0.8rem' }}>Link</button>
                <a href={`https://testnet.arcscan.app/tx/${h.hash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Tx</a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', opacity: 0.5 }}>No history found.</p>
      )}
    </div>
  )
}

function Footer() {
  return (
    <footer style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.6, fontSize: '0.8rem' }}>
      <p>Built on Arc by Circle</p>
      <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '12px' }}>
        <a href="https://docs.arc.network" target="_blank" rel="noopener noreferrer" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Docs</a>
        <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Explorer</a>
        <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Faucet</a>
      </div>
    </footer>
  )
}

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/create" element={<CreateInvoice />} />
          <Route path="/invoice/:id" element={<InvoiceDetail />} />
          <Route path="/my-invoices" element={<MyInvoices />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  )
}

export default App
