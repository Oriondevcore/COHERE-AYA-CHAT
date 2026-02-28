import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Volume2, Loader } from 'lucide-react';
import { clsx } from 'clsx';
import VoiceRecorder from './VoiceRecorder';
import TextToSpeech from './TextToSpeech';
import ParticleBackground from './ParticleBackground';

interface Message {
  id: string;
  role: 'guest' | 'concierge';
  text: string;
  timestamp: Date;
  intent?: string;
}

interface GuestContext {
  guestId: string;
  roomNumber: string;
  guestName: string;
  language: string;
}

export default function OrionChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'concierge',
      text: "Hello! I'm ORION, your personal concierge. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  
  const [loading, setLoading] = useState(false);
  const [guestContext, setGuestContext] = useState<GuestContext>({
    guestId: 'guest_001',
    roomNumber: '1205',
    guestName: 'Victoria Okafor',
    language: 'en',
  });
  
  const [gasUrl] = useState('https://script.google.com/macros/s/AKfycby3ql3W0wLKJSNfOD1_LJ_-EpdVopB00x-Y7cI2QKZDE_ZrU8ozUTepx_Z9LGyjfU06hg/exec');
  const [lastResponse, setLastResponse] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceRecorderRef = useRef<any>(null);
  const ttsRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !gasUrl) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'guest',
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'sendMessage',
          guestId: guestContext.guestId,
          roomNumber: guestContext.roomNumber,
          guestName: guestContext.guestName,
          message: text.trim(),
          language: guestContext.language,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const conciergeMessage: Message = {
          id: Date.now().toString() + '_resp',
          role: 'concierge',
          text: data.response,
          timestamp: new Date(),
          intent: data.intent,
        };
        setMessages((prev) => [...prev, conciergeMessage]);
        setLastResponse(data.response);

        if (ttsRef.current && data.response) {
          setTimeout(() => {
            ttsRef.current?.playTTS(data.response, guestContext.language);
          }, 500);
        }
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Connection error. Check GAS URL.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    if (transcript.trim()) {
      sendMessage(transcript);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 flex flex-col h-screen">
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-gold-500/30 px-6 py-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gold-500">◆ ORION Concierge</h1>
              <p className="text-sm text-slate-400">Powered by Cohere AYA</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={clsx(
                  'animate-fade-in',
                  message.role === 'guest' ? 'flex justify-end' : 'flex justify-start'
                )}
              >
                <div
                  className={clsx(
                    'max-w-xs lg:max-w-md rounded-lg px-4 py-3 shadow-lg',
                    message.role === 'guest'
                      ? 'bg-gradient-to-r from-gold-500/20 to-gold-500/10 border border-gold-500/50 text-slate-100'
                      : 'bg-slate-700/50 border border-slate-600 text-slate-100'
                  )}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex space-x-2 items-center bg-slate-700/50 rounded-lg px-4 py-3">
                  <Loader className="w-4 h-4 text-gold-500 animate-spin" />
                  <span className="text-sm text-slate-400">ORION is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="bg-gradient-to-t from-slate-900 to-slate-800/50 border-t border-gold-500/30 px-6 py-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {lastResponse && (
              <div className="flex items-center gap-2 bg-slate-700/30 rounded-lg p-3 border border-gold-500/20">
                <TextToSpeech
                  ref={ttsRef}
                  text={lastResponse}
                  language={guestContext.language}
                />
                <span className="text-xs text-slate-400 flex-1">
                  Tap speaker to hear response
                </span>
              </div>
            )}

            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider">
                🎤 Voice Input
              </p>
              <VoiceRecorder
                ref={voiceRecorderRef}
                onTranscript={handleVoiceInput}
                language={guestContext.language}
              />
            </div>

            <TextInputArea
              onSend={sendMessage}
              disabled={loading}
            />

            <p className="text-xs text-slate-500 text-center">
              Voice first • Text second • Real Cohere AYA
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function TextInputArea({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !disabled && handleSend()}
        placeholder="Type your request..."
        disabled={disabled}
        className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-gold-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="bg-gold-500 hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold px-6 py-3 rounded-lg transition flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
        Send
      </button>
    </div>
  );
}