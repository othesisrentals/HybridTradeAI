'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, X, Send, Bot, User } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
}

interface ChatWidgetProps {
  conversationId?: string
}

export function ChatWidget({ conversationId: initialConversationId }: ChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingHistory, setFetchingHistory] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && conversationId) {
      fetchConversation()
    } else if (open && !conversationId) {
      createConversation()
    }
  }, [open, conversationId])

  const createConversation = async () => {
    try {
      const response = await fetch('/api/ai/conversations', {
        method: 'POST',
      })
      const data = await response.json()
      if (data.conversation) {
        setConversationId(data.conversation.id)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const fetchConversation = async () => {
    if (!conversationId) return

    setFetchingHistory(true)
    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}`)
      const data = await response.json()
      if (data.conversation?.messages) {
        setMessages(data.conversation.messages)
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error)
    } finally {
      setFetchingHistory(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !conversationId || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: input,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ASSISTANT',
        content: data.response.message,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
      setMessages((prev) => prev.slice(0, -1)) // Remove user message on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {open && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col shadow-2xl z-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-lg">AI Support</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {fetchingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading conversation...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Welcome! I'm your AI assistant.
                </p>
                <p className="text-xs text-muted-foreground">
                  Ask me about investments, plans, withdrawals, or anything else!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'USER' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'ASSISTANT' && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'USER'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatDateTime(message.createdAt)}
                      </p>
                    </div>
                    {message.role === 'USER' && (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce delay-75" />
                        <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce delay-150" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <CardContent className="border-t p-4">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading || !conversationId}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={loading || !conversationId}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  )
}
