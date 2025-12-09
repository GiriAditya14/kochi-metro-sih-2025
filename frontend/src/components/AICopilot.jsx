import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { chatWithCopilot } from '../services/api'

export default function AICopilot({ isOpen, onClose, context = {} }) {
  const { t, i18n } = useTranslation()
  
  const getWelcomeMessage = () => {
    return t('copilot.welcome', {
      defaultValue: `Hello! I'm your KMRL Copilot. I can help you with:

• **Train assignments** - Why was a train assigned to SERVICE/STANDBY/IBL?
• **Branding SLA** - Check which trains need more exposure
• **Maintenance alerts** - View pending job cards
• **What-if scenarios** - Simulate different situations

How can I help you today?`
    })
  }

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: getWelcomeMessage()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Update welcome message when language changes
  useEffect(() => {
    setMessages(prev => {
      // Only update the first message if it's the welcome message (assistant role and it's the first one)
      if (prev.length > 0 && prev[0].role === 'assistant') {
        const updatedMessages = [...prev]
        updatedMessages[0] = {
          role: 'assistant',
          content: getWelcomeMessage()
        }
        return updatedMessages
      }
      return prev
    })
  }, [i18n.language])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await chatWithCopilot(userMessage, context)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.response 
      }])
    } catch (error) {
      console.error('Copilot error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: t('copilot.error', {
          defaultValue: 'I apologize, but I encountered an error processing your request. Please try again or check if the backend is running.'
        })
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestedQueries = [
    t('copilot.query1', { defaultValue: "Why is TS-205 assigned to IBL?" }),
    t('copilot.query2', { defaultValue: "Which trains have branding SLA at risk?" }),
    t('copilot.query3', { defaultValue: "Show me overdue maintenance jobs" }),
    t('copilot.query4', { defaultValue: "What if 3 trains become unavailable?" })
  ]

  if (!isOpen) return null

  return (
    <div 
      className="fixed right-0 top-0 bottom-0 w-96 backdrop-blur-xl border-l flex flex-col z-50 animate-slide-in"
      style={{
        background: 'var(--glass-bg)',
        borderColor: 'rgb(var(--color-border))'
      }}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>
              {t('copilot.title', { defaultValue: 'AI Copilot' })}
            </h3>
            <p className="text-xs" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
              {t('copilot.poweredBy', { defaultValue: 'Powered by Gemini' })}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
          style={{ color: 'rgb(var(--color-text-secondary))' }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' 
                ? 'bg-orange-500/20 text-orange-500 dark:text-orange-400' 
                : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`flex-1 p-3 rounded-xl border ${
              msg.role === 'user' 
                ? 'bg-orange-500/10 border-orange-500/20' 
                : ''
            }`}
            style={msg.role !== 'user' ? {
              background: 'rgba(var(--color-bg-tertiary), 0.5)',
              borderColor: 'rgb(var(--color-border))'
            } : {}}>
              <div 
                className="text-sm whitespace-pre-wrap prose prose-sm max-w-none"
                style={{ color: 'rgb(var(--color-text-primary))' }}
                dangerouslySetInnerHTML={{ 
                  __html: msg.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: rgb(var(--color-text-primary)); font-weight: 600;">$1</strong>')
                    .replace(/\n/g, '<br />')
                }}
              />
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1 p-3 rounded-xl border" style={{ background: 'rgba(var(--color-bg-tertiary), 0.5)', borderColor: 'rgb(var(--color-border))' }}>
              <div className="flex items-center gap-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{t('copilot.thinking', { defaultValue: 'Thinking...' })}</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested queries */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs mb-2" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
            {t('copilot.tryAsking', { defaultValue: 'Try asking:' })}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((query, idx) => (
              <button
                key={idx}
                onClick={() => setInput(query)}
                className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                style={{
                  background: 'rgba(var(--color-bg-tertiary), 0.5)',
                  borderColor: 'rgb(var(--color-border))',
                  color: 'rgb(var(--color-text-secondary))'
                }}
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: 'rgb(var(--color-border))' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('copilot.placeholder', { defaultValue: 'Ask about trains, plans, or scenarios...' })}
            className="input flex-1"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="btn btn-primary px-3"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

