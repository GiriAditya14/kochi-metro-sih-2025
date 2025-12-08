import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react'
import { chatWithCopilot } from '../services/api'

export default function AICopilot({ isOpen, onClose, context = {} }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your KMRL Copilot. I can help you with:

• **Train assignments** - Why was a train assigned to SERVICE/STANDBY/IBL?
• **Branding SLA** - Check which trains need more exposure
• **Maintenance alerts** - View pending job cards
• **What-if scenarios** - Simulate different situations

How can I help you today?`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
        content: 'I apologize, but I encountered an error processing your request. Please try again or check if the backend is running.' 
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
    "Why is TS-205 assigned to IBL?",
    "Which trains have branding SLA at risk?",
    "Show me overdue maintenance jobs",
    "What if 3 trains become unavailable?"
  ]

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 flex flex-col z-50 animate-slide-in">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-white">AI Copilot</h3>
            <p className="text-xs text-slate-500">Powered by Gemini</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
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
                ? 'bg-orange-500/20 text-orange-400' 
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`flex-1 p-3 rounded-xl ${
              msg.role === 'user' 
                ? 'bg-orange-500/10 border border-orange-500/20' 
                : 'bg-slate-800/50 border border-slate-700'
            }`}>
              <div 
                className="text-sm text-slate-200 whitespace-pre-wrap prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: msg.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br />')
                }}
              />
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested queries */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((query, idx) => (
              <button
                key={idx}
                onClick={() => setInput(query)}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about trains, plans, or scenarios..."
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

