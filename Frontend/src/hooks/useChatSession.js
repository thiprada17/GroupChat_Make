import { useEffect, useMemo, useState } from 'react';
import { billService } from '../services/billService.js';
import { chatService } from '../services/chatService.js';
import { paymentService } from '../services/paymentService.js';

const newId = () => crypto.randomUUID();
export default function useChatSession(members, creatorId = 'thong', groupId = 'default') {
  const storageKey = `groupchat.history.v1.${groupId}`;
  const [initialSession] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && ['idle', 'open', 'closed'].includes(saved.status) && Array.isArray(saved.items) && Array.isArray(saved.messages)) return saved;
    } catch { /* Start an empty chat when storage is empty or invalid. */ }
    return null;
  });
  const [status, setStatus] = useState(() => initialSession?.status || 'idle');
  const [items, setItems] = useState(() => initialSession?.items || []);
  const [title, setTitle] = useState(() => initialSession?.title || 'ค่ากิน');
  const [messages, setMessages] = useState(() => initialSession?.messages || []);
  const [paid, setPaid] = useState(() => initialSession?.paid || {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const total = items.reduce((sum, item) => sum + Math.round(item.price * 100), 0) / 100;
  const memberSummaries = useMemo(() => members
    .filter(member => items.some(item => (item.assignedUserIds || []).includes(member.id)))
    .map(member => {
      const totalAmount = items.reduce((sum, item) => {
        const assignedUserIds = item.assignedUserIds || [];
        if (!assignedUserIds.includes(member.id) || assignedUserIds.length === 0) return sum;
        return sum + Number(item.price) / assignedUserIds.length;
      }, 0);
      return {
        userId: member.id,
        name: member.name,
        totalAmount: Number(totalAmount.toFixed(2)),
        isPaid: member.id === creatorId || Boolean(paid[member.id]),
      };
    }), [items, members, creatorId, paid]);
  const shares = useMemo(() => Object.fromEntries(memberSummaries.map(summary => [summary.userId, summary.totalAmount])), [memberSummaries]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ status, items, title, messages, paid })); }
    catch { /* Chat stays usable if browser storage is full or unavailable. */ }
  }, [storageKey, status, items, title, messages, paid]);

  async function startSession(bill) {
    setBusy(true); setError('');
    try {
      const saved = await billService.saveBill(bill);
      setItems(saved.items.map(item => ({ ...item, assignedUserIds: [...item.assignedUserIds] })));
      setTitle(saved.title || 'ค่ากิน'); setPaid({}); setStatus('open');
      setMessages([{ id: newId(), type: 'divider', content: 'เปิด Session' }, { id: newId(), type: 'bill', senderId: creatorId, billSession: { createdById: creatorId } }]);
    } catch (cause) { setError(cause.message); throw cause; }
    finally { setBusy(false); }
  }

  function toggleItem(itemId, userId) {
    if (status !== 'open') return;
    const selectedUserId = typeof userId === 'string' ? userId : userId?.id;
    if (!selectedUserId) return;
    setItems(current => current.map(item => item.id !== itemId ? item : {
      ...item,
      assignedUserIds: (item.assignedUserIds || []).includes(selectedUserId) ? item.assignedUserIds.filter(id => id !== selectedUserId) : [...(item.assignedUserIds || []), selectedUserId],
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
      const collectionMessages = memberSummaries.filter(summary => !summary.isPaid && summary.totalAmount > 0).map(summary => ({ id: newId(), type: 'collection', senderId: creatorId, recipientId: summary.userId, amount: summary.totalAmount }));
      setMessages(current => [...current.filter(message => message.type !== 'bill'),
        { id: newId(), type: 'status', content: 'กำลังสรุปบิล...' },
        { id: newId(), type: 'divider', content: 'ปิด Session' },
        { id: newId(), type: 'bill', senderId: creatorId, billSession: { createdById: creatorId } },
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

  async function transfer(amount, recipientId, senderId = creatorId) {
    setBusy(true); setError('');
    try {
      const result = await paymentService.transfer(amount);
      setMessages(current => [...current, { id: newId(), type: 'receipt', senderId, recipientId, amount: result.amount }]);
      return result;
    } catch (cause) { setError(cause.message); return null; }
    finally { setBusy(false); }
  }

  return { status, items, title, messages, paid, busy, error, setError, total, shares, memberSummaries, startSession, toggleItem, send, closeSession, pay, transfer };
}
