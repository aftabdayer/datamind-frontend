import { useState, useRef, useEffect } from 'react'
import { chatWithData } from '../lib/api'

interface Props { apiKey: string; datasetContext: string }

const SUGGESTIONS = [
  'What is the biggest business risk?',
  'Which columns have the most outliers?',
  'Summarise the key trends',
  'Predict next quarter',
  'Export risk report',
]

export default function ChatTab({ apiKey, datasetContext }: Props) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text?: string) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    const userMsg = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const res = await chatWithData(apiKey, msg, messages, datasetContext)
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please check your API key.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem', boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
        }}>◈</div>
        <div>
          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#f0f0f5', margin: 0 }}>Analytical Assistant</p>
          <p style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Powered by DataMind Core</p>
        </div>
        <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.25rem' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: '3rem', color: '#334155' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>◈</p>
            <p style={{ fontSize: '0.9rem', color: '#475569' }}>Ask anything about your dataset</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.6rem', alignItems: 'flex-start' }}>
            {m.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', color: 'white', fontWeight: 700,
                boxShadow: '0 3px 10px rgba(124,58,237,0.35)',
              }}>AI</div>
            )}
            <div className={m.role === 'user' ? 'bubble-user' : 'bubble-ai'}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', color: 'white', fontWeight: 700,
            }}>AI</div>
            <div className="bubble-ai" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#475569',
                  animation: 'pulse 1.2s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion pills */}
      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => send(s)} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(139,92,246,0.2)',
            color: '#a78bfa', fontSize: '0.75rem', padding: '0.3rem 0.8rem',
            borderRadius: 999, cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: 'Instrument Sans,sans-serif',
          }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(139,92,246,0.1)'; (e.target as HTMLElement).style.borderColor = 'rgba(139,92,246,0.4)' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.target as HTMLElement).style.borderColor = 'rgba(139,92,246,0.2)' }}
          >{s}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: '0.65rem', alignItems: 'center',
        background: '#18181f', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, padding: '0.65rem 0.75rem',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about your data..."
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: '#f0f0f5', fontSize: '0.875rem',
            fontFamily: 'Instrument Sans,sans-serif',
          }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          style={{
            width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer',
            background: input.trim() && !loading ? 'linear-gradient(135deg,#7c3aed,#4338ca)' : '#18181f',
            color: input.trim() && !loading ? 'white' : '#334155',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.9rem', transition: 'all 0.15s',
            boxShadow: input.trim() ? '0 3px 10px rgba(124,58,237,0.3)' : 'none',
            flexShrink: 0,
          }}
        >➤</button>
      </div>
    </div>
  )
}
