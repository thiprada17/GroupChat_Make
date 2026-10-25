import React from 'react';
import { CheckCheck, ChevronDown, LoaderCircle, Wallet } from 'lucide-react';

export default function ChatMessageBubble({ message, people = [], currentUser = 'thong', onPay, busy = false }) {
  const person = people.find(user => user.id === message.senderId) || people[0];
  const recipient = people.find(user => user.id === message.recipientId);

  if (message.type === 'divider') return <div className="my-3 flex items-center gap-3 text-xs text-[#34414C]"><span className="h-px flex-1 bg-[#45585B]/70"/>{message.content}<span className="h-px flex-1 bg-[#45585B]/70"/></div>;

  if (message.type === 'status') return <div className="my-3 ml-auto w-fit rounded-xl border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-700">{message.content}</div>;

  if (message.type === 'text') return <div className={'my-3 flex items-start gap-2 '+(message.senderId === currentUser ? 'flex-row-reverse' : '')}>
    <span className="h-8 w-8 shrink-0 rounded-full" style={{ background: person?.color || person?.avatarColor || '#204066' }}/>
    <div className={message.senderId === currentUser ? 'text-right' : ''}><small className="mb-1 block text-[10px] text-[#69868D]">{message.senderId === currentUser ? 'คุณ' : person?.name}</small><p className={'max-w-[300px] rounded-2xl bg-white px-3 py-2 text-left text-sm text-[#34414C] '+(message.senderId === currentUser ? 'rounded-tr-sm' : 'rounded-tl-sm')}>{message.content}</p></div>
  </div>;

  if (message.type === 'collection') return <div className="my-2 flex min-h-[82px] w-fit max-w-[310px] items-center gap-3 rounded-[20px] bg-[#F5F5F5] px-3 py-3 text-[#34414C]">
    <div className="min-w-0 flex-1"><b className="block text-sm">เรียกเก็บเงิน</b><span className="text-sm">{message.recipientId === currentUser ? 'คุณ' : recipient?.name}</span></div>
    <div className="flex min-w-[105px] flex-col items-end gap-2"><strong className={'text-lg '+(message.isPaid ? 'text-[#69C9C8]' : 'text-red-500')}>{message.amount.toFixed(2)}</strong>{message.recipientId === currentUser ? <button type="button" onClick={() => onPay?.(message.recipientId)} disabled={busy || message.isPaid} className="flex h-7 min-w-[125px] items-center justify-center gap-1 rounded-lg bg-[#00B8E6] px-3 text-sm text-white disabled:bg-[#69C9C8]">{busy ? <LoaderCircle size={14} className="animate-spin"/> : <Wallet size={14}/>} {message.isPaid ? 'จ่ายแล้ว' : 'จ่ายทันที'}</button> : <ChevronDown size={18} className="mr-1"/>}</div>
  </div>;

  if (message.type === 'receipt') return <div className="my-4 ml-auto grid w-fit min-w-[205px] grid-cols-2 gap-x-4 rounded-2xl rounded-tr-sm bg-[#00B8E6] p-3 text-white shadow-sm"><span className="flex items-center gap-1 text-xs"><CheckCheck size={14}/> โอนเงิน</span><b className="text-right">{message.amount < 0 ? '- ' : '+ '}{Math.abs(message.amount).toFixed(2)}</b><small className="col-span-2 text-cyan-50">ชำระบิลเรียบร้อย</small></div>;

  return null;
}
