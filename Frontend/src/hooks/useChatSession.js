import { useEffect, useMemo, useState } from 'react';
import { billService } from '../services/billService.js';
import { chatService } from '../services/chatService.js';
import { paymentService } from '../services/paymentService.js';

const newId = () => crypto.randomUUID();
const itemNetAmount = item => {
  const cents = Math.round(Number(item.price) * 100) + (item.adjustments || []).reduce((sum, adjustment) => sum + Math.round(Number(adjustment.amount) * 100), 0);
  return cents / 100;
};
export default function useChatSession(members, creatorId = 'thong', groupId = 'default') {
  const storageKey = `groupchat.history.v1.${groupId}`;
  const [initialSession] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && ['idle', 'open', 'closed'].includes(saved.status) && Array.isArray(saved.items) && Array.isArray(saved.messages)) return saved;
    } catch { /* Start an empty chat when storage is empty or invalid. */ }
    return null;
  });
  const initialCreatorId = initialSession?.createdById
    || initialSession?.messages?.find(message => message.type === 'bill')?.billSession?.createdById
    || creatorId;
  const [status, setStatus] = useState(() => initialSession?.status || 'idle');
  const [items, setItems] = useState(() => initialSession?.items || []);
  const [charges, setCharges] = useState(() => initialSession?.charges || []);
  const [sessionCreatorId, setSessionCreatorId] = useState(initialCreatorId);
  const [title, setTitle] = useState(() => initialSession?.title || 'ค่ากิน');
  const [messages, setMessages] = useState(() => initialSession?.messages || []);
  const [paid, setPaid] = useState(() => initialSession?.paid || {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const itemSubtotal = items.reduce((sum, item) => sum + Math.round(itemNetAmount(item) * 100), 0) / 100;
  const chargeTotal = charges.reduce((sum, charge) => sum + Math.round((Number(charge.amount) || 0) * 100), 0) / 100;
  const total = itemSubtotal + chargeTotal;
  const assignedSubtotal = items.reduce((sum, item) => (item.assignedUserIds || []).length ? sum + itemNetAmount(item) : sum, 0);
  const memberSummaries = useMemo(() => members
    .filter(member => items.some(item => (item.assignedUserIds || []).includes(member.id)))
    .map(member => {
      const totalAmount = items.reduce((sum, item) => {
        const assignedUserIds = item.assignedUserIds || [];
        if (!assignedUserIds.includes(member.id) || assignedUserIds.length === 0) return sum;
        return sum + itemNetAmount(item) / assignedUserIds.length;
      }, 0);
      const feeShare = assignedSubtotal > 0
        ? chargeTotal * totalAmount / assignedSubtotal
        : 0;
      return {
        userId: member.id,
        name: member.name,
        totalAmount: Number((totalAmount + feeShare).toFixed(2)),
        isPaid: member.id === sessionCreatorId || Boolean(paid[member.id]),
      };
    }), [items, members, sessionCreatorId, paid, assignedSubtotal, chargeTotal]);
  const shares = useMemo(() => Object.fromEntries(memberSummaries.map(summary => [summary.userId, summary.totalAmount])), [memberSummaries]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ status, items, charges, title, messages, paid, createdById: sessionCreatorId })); }
    catch { /* Chat stays usable if browser storage is full or unavailable. */ }
  }, [storageKey, status, items, charges, title, messages, paid, sessionCreatorId]);

  async function startSession(bill, createdById = creatorId) {
    setBusy(true); setError('');
    try {
      const saved = await billService.saveBill(bill);
      setItems(saved.items.map(item => ({ ...item, assignedUserIds: [...item.assignedUserIds] })));
      setCharges(saved.charges || []);
      setSessionCreatorId(createdById);
      setTitle(saved.title || 'ค่ากิน'); setPaid({}); setStatus('open');
      setMessages([{ id: newId(), type: 'divider', content: 'เปิด Session' }, { id: newId(), type: 'bill', senderId: createdById, billSession: { createdById } }]);
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
      await billService.closeSession({ items, shares, charges });
      setStatus('closed');
      const collectionMessages = memberSummaries.filter(summary => !summary.isPaid && summary.totalAmount > 0).map(summary => ({ id: newId(), type: 'collection', senderId: sessionCreatorId, recipientId: summary.userId, amount: summary.totalAmount }));
      setMessages(current => [...current.filter(message => message.type !== 'bill'),
        { id: newId(), type: 'status', content: 'กำลังสรุปบิล...' },
        { id: newId(), type: 'divider', content: 'ปิด Session' },
        { id: newId(), type: 'bill', senderId: sessionCreatorId, billSession: { createdById: sessionCreatorId } },
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

  return { status, items, charges, title, messages, paid, busy, error, setError, total, shares, memberSummaries, createdById: sessionCreatorId, startSession, toggleItem, send, closeSession, pay, transfer };
}
