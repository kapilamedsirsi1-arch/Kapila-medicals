import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  CreditCard,
  Package,
  Users,
} from 'lucide-react';
import { db } from '../../services/db';
import { askAiAssistant } from '../../services/geminiClient';
import { User } from '../../types';

interface AiAssistantPanelProps {
  currentUser: User;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({ currentUser }) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Good day, Suresh ji. I am your Kapila Medical Agencies Executive Assistant. You can ask me any question regarding today’s collections, overdue payments, low stock formulations, or tour boy performance.',
      time: '09:00 AM',
    },
  ]);

  const parties = db.getParties();
  const products = db.getProducts();
  const orders = db.getOrders();
  const payments = db.getPayments();
  const expenses = db.getExpenses();
  const staff = db.getStaff();
  const visits = db.getVisits();

  const quickPrompts = [
    "Show today's total collection and cash breakdown.",
    'Which chemist parties have overdue payments?',
    'Which tour boy collected the most this month?',
    'Show products with stock below reorder level.',
    'What is our total outstanding across Sirsi & Siddapur?',
    'Show pending staff expense claims requiring approval.',
  ];

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || loading) return;

    const userMsg: Message = {
      role: 'user',
      text: prompt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayPayments = payments.filter((p) => p.date === todayStr);

    const businessContext = {
      agency: 'M/s. Kapila Medical Agencies, Sirsi',
      gstin: '29AABFK9897N1Z7',
      totalSalesToday: orders.filter((o) => o.date === todayStr).reduce((s, o) => s + o.grandTotal, 0),
      totalCollection: todayPayments.reduce((s, p) => s + p.amount, 0),
      cashTotal: todayPayments.filter((p) => p.mode === 'CASH').reduce((s, p) => s + p.amount, 0),
      chequeTotal: todayPayments.filter((p) => p.mode === 'CHEQUE').reduce((s, p) => s + p.amount, 0),
      upiTotal: todayPayments.filter((p) => p.mode === 'UPI' || p.mode === 'BANK_TRANSFER').reduce((s, p) => s + p.amount, 0),
      totalOutstanding: parties.reduce((s, p) => s + p.currentOutstanding, 0),
      partiesCount: parties.length,
      productsCount: products.length,
      overdueParties: parties.filter((p) => p.currentOutstanding > 50000).map((p) => ({
        name: p.name,
        area: p.area,
        outstanding: p.currentOutstanding,
        creditLimit: p.creditLimit,
        creditDays: p.creditDays,
      })),
      lowStockProducts: products.filter((p) => p.stock <= p.reorderLevel).map((p) => ({
        name: p.name,
        company: p.companyName,
        stock: p.stock,
        reorderLevel: p.reorderLevel,
      })),
      staffList: staff.map((s) => ({
        name: s.fullName,
        code: s.employeeCode,
        area: s.assignedArea,
        collectionsThisMonth: payments.filter((p) => p.staffId === s.id).reduce((sum, p) => sum + p.amount, 0),
        ordersThisMonth: orders.filter((o) => o.staffId === s.id).length,
      })),
      pendingExpensesCount: expenses.filter((e) => e.status === 'Pending Approval').length,
    };

    try {
      const answer = await askAiAssistant(prompt, businessContext);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Unable to connect to AI Assistant. ' + e.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Kapila AI Business Assistant
            </h2>
            <p className="text-xs text-slate-500">
              Grounded in live database figures • No hallucinations
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-3 py-1.5 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition text-left"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 min-h-[420px] max-h-[550px] overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 ${
              m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                m.role === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xs'
              }`}
            >
              {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80'
              }`}
            >
              {m.text}
              <span
                className={`block text-[10px] mt-1.5 ${
                  m.role === 'user' ? 'text-sky-200 text-right' : 'text-slate-400'
                }`}
              >
                {m.time}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-sky-600 animate-pulse p-3 bg-sky-50 rounded-xl w-max">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Analyzing live pharmaceutical database & compiling insights...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm"
      >
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ask anything (e.g. Which chemist has overdue invoices? What is today's cash collection?)..."
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-transparent border-0 outline-none placeholder-slate-400 text-slate-800"
        />
        <button
          type="submit"
          disabled={loading || !inputPrompt.trim()}
          className="p-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 text-white rounded-xl shadow-xs transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
