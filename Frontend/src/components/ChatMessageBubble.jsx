import React from 'react';
import { CheckCheck, ChevronDown, LoaderCircle, Wallet } from 'lucide-react';

function Profile({ user, own = false }) {
  return <div className={'mb-2 flex items-center gap-2 '+(own ? 'flex-row-reverse' : '')}>
    <span className="grid h-[30px] w-[30px] place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: user?.color || user?.avatarColor || '#204066' }}>{user?.id === 'thong' ? 't' : ''}</span>
    <small className="text-[10px] text-[#69868D]">{user?.name || 'thong'}</small>
  </div>;
}

export default function ChatMessageBubble({ message, people = [], currentUser = 'thong', onPay, busy = false }) {
  const person = people.find(user => user.id === message.senderId) || people[0];
  const recipient = people.find(user => user.id === message.recipientId);
  const own = message.senderId === currentUser;
  const alignment = own ? 'ml-auto items-end' : 'mr-auto items-start';

  if (message.type === 'divider') return <div className="my-3 flex items-center gap-3 text-xs text-[#34414C]"><span className="h-px flex-1 bg-[#45585B]/70"/>{message.content}<span className="h-px flex-1 bg-[#45585B]/70"/></div>;

  if (message.type === 'status') return <div className="my-3 ml-auto w-fit rounded-xl border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-700">{message.content}</div>;

  if (message.type === 'text') return <div className={'my-3 flex w-fit max-w-full flex-col '+alignment}>
    <Profile user={person} own={own}/><p className={'max-w-[300px] rounded-2xl bg-white px-3 py-2 text-sm text-[#34414C] '+(own ? 'rounded-tr-sm' : 'rounded-tl-sm')}>{message.content}</p>
  </div>;

  if (message.type === 'collection') return <div className={'my-2 flex w-full max-w-[310px] flex-col '+alignment}>
    <Profile user={person} own={own}/><div className="flex min-h-[82px] w-full items-center gap-3 rounded-[20px] bg-[#F5F5F5] px-3 py-3 text-[#34414C]">
      <div className="min-w-0 flex-1"><b className="block text-sm">เรียกเก็บเงิน</b><span className="text-sm">{message.recipientId === currentUser ? 'คุณ' : recipient?.name}</span></div>
      <div className="flex min-w-[105px] flex-col items-end gap-2"><strong className={'text-lg '+(message.isPaid ? 'text-[#69C9C8]' : 'text-red-500')}>{message.amount.toFixed(2)}</strong>{message.recipientId === currentUser ? <button type="button" onClick={() => onPay?.(message.recipientId)} disabled={busy || message.isPaid} className="flex h-7 min-w-[125px] items-center justify-center gap-1 rounded-lg bg-[#00B8E6] px-3 text-sm text-white disabled:bg-[#69C9C8]">{busy ? <LoaderCircle size={14} className="animate-spin"/> : <Wallet size={14}/>} {message.isPaid ? 'จ่ายแล้ว' : 'จ่ายทันที'}</button> : <ChevronDown size={18} className="mr-1"/>}</div>
    </div>
  </div>;

  if (message.type === 'receipt') return <div className={'my-3 flex w-fit max-w-full flex-col '+alignment}>
    <Profile user={person} own={own}/><div className="grid min-h-[82px] w-[min(310px,calc(100vw-48px))] grid-cols-2 gap-x-4 rounded-2xl bg-[#00B8E6] p-3 text-white shadow-sm"><span className="flex items-center gap-1 text-sm font-semibold">{message.amount < 0 ? 'โอนเงิน' : 'โอนเงิน'}</span><b className="text-right text-lg">{message.amount < 0 ? '- ' : '+ '}{Math.abs(message.amount).toFixed(2)}</b><ChevronDown size={18} className="col-span-2 ml-auto"/></div>
  </div>;

  return null;
}
