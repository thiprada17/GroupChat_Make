import React, { useState } from 'react';
import { ArrowLeft, Check, ChevronDown, MoreHorizontal, ReceiptText, Send, Wallet, X } from 'lucide-react';
import useChatSession from '../hooks/useChatSession.js';
import AddBillScreen from './AddBillScreen.jsx';
import BillSessionCard from './BillSessionCard.jsx';
import ChatMessageBubble from './ChatMessageBubble.jsx';

function Avatar({ user, size = 30 }) {
  return <span className="grid shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: user?.color || '#204066', width: size, height: size }}>{user?.id === 'thong' ? 't' : ''}</span>;
}

function ActionBar({ onTransfer, onAddBill }) {
  return <footer className="relative z-10 flex h-[123px] shrink-0 items-center justify-center gap-20 rounded-t-2xl bg-[#8AE3FF] px-6">
    <button type="button" onClick={onTransfer} className="flex min-w-20 flex-col items-center gap-1 text-[#294E74]"><Wallet size={23} strokeWidth={1.6}/><span className="text-sm">โอนเงิน</span></button>
    <button type="button" onClick={onAddBill} className="flex min-w-20 flex-col items-center gap-1 text-[#294E74]"><ReceiptText size={23} strokeWidth={1.6}/><span className="text-sm">เพิ่มบิล</span></button>
  </footer>;
}

export default function GroupChatScreen({ group, onBack }) {
  const creatorId = group.createdById || group.members[0]?.id || 'thong';
  const chat = useChatSession(group.members, creatorId);
  const [showBill, setShowBill] = useState(false);
  const [currentUser, setCurrentUser] = useState('thong');
  const [showMembers, setShowMembers] = useState(false);
  const [message, setMessage] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [recipientId, setRecipientId] = useState(group.members.find(person => person.id !== 'thong')?.id || '');
  const firstCollectionIndex = chat.messages.findIndex(item => item.type === 'collection');

  async function sendMessage() {
    if (!message.trim()) return;
    await chat.send(message, currentUser);
    setMessage('');
  }
  async function sendTransfer(event) {
    event.preventDefault();
    const amount = Number(transferAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const result = await chat.transfer(amount, recipientId);
    if (result) { setTransferAmount(''); setShowTransfer(false); }
  }

  return <main className="relative mx-auto flex h-[100dvh] min-h-[540px] max-w-3xl flex-col overflow-hidden bg-[#EFF7F2] sm:my-5 sm:h-[calc(100dvh-40px)] sm:rounded-3xl sm:shadow-2xl">
    <header className="relative z-20 flex h-[100px] shrink-0 items-center justify-between bg-[#8AE3FF] px-3 shadow-sm">
      <button type="button" aria-label="Back" onClick={onBack} className="grid h-10 w-10 place-items-center text-[#00B8E6]"><ArrowLeft size={25}/></button>
      <button type="button" onClick={() => setShowMembers(value => !value)} className="flex flex-1 items-center gap-2 text-left"><span className="sr-only">สมาชิก</span><b className="text-base font-bold text-[#1A3048]">{group.name}</b><ChevronDown size={14} className="text-[#00B8E6]"/></button>
      <button type="button" aria-label="ตัวเลือก" onClick={() => setShowMembers(value => !value)} className="grid h-10 w-10 place-items-center text-[#00B8E6]"><MoreHorizontal size={22}/></button>
    </header>

    {showMembers && <section className="absolute right-3 top-[75px] z-30 w-56 rounded-xl bg-white p-3 shadow-lg"><b className="px-2 text-xs">ทดลองดูเป็นสมาชิก</b>{group.members.map(person => <button type="button" key={person.id} onClick={() => { setCurrentUser(person.id); setShowMembers(false); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs hover:bg-cyan-50"><Avatar user={person} size={25}/>{person.name}{currentUser === person.id && <Check size={14} className="ml-auto text-teal-500"/>}</button>)}</section>}

    <section className="relative flex-1 overflow-y-auto bg-gradient-to-b from-[#8AE3FF] via-[#D6F4EC] to-[#EFF7F2] px-3 pb-5 pt-3 sm:px-8" aria-label="Chat messages">
      {chat.status === 'idle' && chat.messages.length === 0 && <div className="flex h-full items-center justify-center"><p className="rounded-xl bg-white/70 px-4 py-2 text-sm text-slate-500">เริ่มพูดคุย หรือเพิ่มบิลเพื่อหารค่าอาหาร</p></div>}
      {chat.messages.map((item, index) => <React.Fragment key={`${item.id}-${index}`}>
        {item.type === 'bill' ? <div className="my-2 w-full max-w-[350px]"><div className="mb-2 flex items-center gap-2"><Avatar user={group.members.find(person => person.id === creatorId) || group.members[0]}/><small className="text-[10px] text-[#708A8E]">{group.members.find(person => person.id === creatorId)?.name || 'thong'}</small></div><BillSessionCard title={chat.title} creatorId={creatorId} items={chat.items} members={group.members} status={chat.status} shares={chat.shares} total={chat.total} currentUser={currentUser} paid={chat.paid} busy={chat.busy} onToggle={chat.toggleItem} onClose={chat.closeSession} onEdit={() => setShowBill(true)}/></div>
          : <>{item.type === 'collection' && index === firstCollectionIndex && <div className="my-2 flex items-center gap-2"><Avatar user={group.members.find(person => person.id === creatorId) || group.members[0]}/><small className="text-[10px] text-[#708A8E]">{group.members.find(person => person.id === creatorId)?.name || 'thong'}</small></div>}<ChatMessageBubble message={item} people={group.members} currentUser={currentUser} onPay={chat.pay} busy={chat.busy}/></>}
      </React.Fragment>)}
      {chat.error && <div role="alert" className="my-3 flex items-center justify-between rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{chat.error}<button type="button" onClick={() => chat.setError('')}><X size={15}/></button></div>}
    </section>

    {chat.status === 'open' ? <footer className="relative z-10 flex h-[70px] shrink-0 items-center bg-[#8AE3FF] px-5"><label className="flex h-[39px] w-full items-center rounded-full border border-gray-200 bg-white px-4"><input value={message} onChange={event => setMessage(event.target.value)} onKeyDown={event => event.key === 'Enter' && sendMessage()} className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" placeholder="พิมพ์ข้อความ"/><button type="button" aria-label="Send" onClick={sendMessage} disabled={!message.trim()} className="grid h-7 w-7 place-items-center text-[#00B8E6] disabled:text-gray-300"><Send size={16}/></button></label></footer>
      : <ActionBar onTransfer={() => setShowTransfer(true)} onAddBill={() => setShowBill(true)}/>}

    {showBill && <AddBillScreen groupName={group.name} busy={chat.busy} onBack={() => setShowBill(false)} onConfirmBill={async bill => { await chat.startSession(bill); setShowBill(false); }} />}

    {showTransfer && <div className="fixed inset-0 z-40 grid items-end bg-slate-900/50 backdrop-blur-sm sm:place-items-center sm:p-5"><form onSubmit={sendTransfer} className="w-full rounded-t-3xl bg-white p-5 sm:max-w-sm sm:rounded-3xl"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">โอนเงิน</h2><button type="button" onClick={() => setShowTransfer(false)}><X size={19}/></button></div><label className="mb-3 block text-xs">ผู้รับ<select value={recipientId} onChange={event => setRecipientId(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm">{group.members.filter(person => person.id !== currentUser).map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label className="block text-xs">จำนวนเงิน<input type="number" min="0.01" step="0.01" value={transferAmount} onChange={event => setTransferAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm" placeholder="0.00"/></label><button className="mt-4 w-full rounded-xl bg-[#00B8E6] py-2.5 font-bold text-white">ยืนยันการโอน</button></form></div>}
  </main>;
}
