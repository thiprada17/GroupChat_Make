import { useMemo, useState } from 'react';
import { billService } from '../services/billService.js';
import { chatService } from '../services/chatService.js';
import { paymentService } from '../services/paymentService.js';

const newId = () => crypto.randomUUID();
export default function useChatSession(members, creatorId = 'thong') {
  const [status, setStatus] = useState('idle');
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('ค่ากิน');
  const [messages, setMessages] = useState([]);
  const [paid, setPaid] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const total = items.reduce((sum, item) => sum + Math.round(item.price * 100), 0) / 100;
  const shares = useMemo(() => {
    const totals = Object.fromEntries(members.map(person => [person.id, 0]));
    items.forEach(item => {
      const ids = item.assignedUserIds.filter(id => id in totals);
      if (!ids.length) return;
      const cents = Math.round(item.price * 100), base = Math.floor(cents / ids.length), remainder = cents % ids.length;
      ids.forEach((id, index) => { totals[id] += (base + (index < remainder ? 1 : 0)) / 100; });
    });
    return totals;
  }, [items, members]);

  async function startSession(bill) {
    setBusy(true); setError('');
    try {
      const saved = await billService.saveBill(bill);
      setItems(saved.items.map(item => ({ ...item, assignedUserIds: [...item.assignedUserIds] })));
      setTitle(saved.title || 'ค่ากิน'); setPaid({}); setStatus('open');
      setMessages([{ id: newId(), type: 'divider', content: 'เปิด Session' }, { id: newId(), type: 'bill' }]);
    } catch (cause) { setError(cause.message); throw cause; }
    finally { setBusy(false); }
  }

  function toggleItem(itemId, userId) {
    if (status !== 'open') return;
    setItems(current => current.map(item => item.id !== itemId ? item : {
      ...item,
      assignedUserIds: item.assignedUserIds.includes(userId) ? item.assignedUserIds.filter(id => id !== userId) : [...item.assignedUserIds, userId],
    }));
  }

  async function send(content, senderId) {
    try { const result = await chatService.sendMessage(content); setMessages(current => [...current, { ...result, type: 'text', senderId }]); setError(''); }
    catch (cause) { setError(cause.message); }
  }

  async function closeSession() {
    setBusy(true); setError('');
    try {
      await billService.closeSession({ items, shares });
      setStatus('closed');
      const collectionMessages = members.filter(person => person.id !== creatorId && (shares[person.id] || 0) > 0).map(person => ({ id: newId(), type: 'collection', senderId: creatorId, recipientId: person.id, amount: shares[person.id] }));
      setMessages(current => [...current.filter(message => message.type !== 'bill'),
        { id: newId(), type: 'status', content: 'กำลังสรุปบิล...' },
        { id: newId(), type: 'divider', content: 'ปิด Session' },
        { id: newId(), type: 'bill' },
        ...collectionMessages,
      ]);
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }

  async function pay(userId) {
    setBusy(true); setError('');
    try {
      const result = await paymentService.transfer(shares[userId] || 0);
      setPaid(current => ({ ...current, [userId]: true }));
      setMessages(current => [...current.map(message => message.type === 'collection' && message.recipientId === userId ? { ...message, isPaid: true } : message), { id: newId(), type: 'receipt', senderId: userId, amount: -result.amount }]);
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }

  async function transfer(amount, recipientId) {
    setBusy(true); setError('');
    try {
      const result = await paymentService.transfer(amount);
      setMessages(current => [...current, { id: newId(), type: 'receipt', senderId: 'thong', recipientId, amount: result.amount }]);
      return result;
    } catch (cause) { setError(cause.message); return null; }
    finally { setBusy(false); }
  }

  return { status, items, title, messages, paid, busy, error, setError, total, shares, startSession, toggleItem, send, closeSession, pay, transfer };
}
