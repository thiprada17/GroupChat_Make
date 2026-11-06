import React, { useState } from 'react';
import { CheckCheck, ChevronDown, LoaderCircle, Wallet } from 'lucide-react';

function Profile({ user, own = false }) {
  return <div className={'mb-2 flex items-center gap-2 '+(own ? 'flex-row-reverse' : '')}>
    <span className="grid h-[30px] w-[30px] place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: user?.color || user?.avatarColor || '#204066' }}>{user?.id === 'thong' ? 't' : ''}</span>
    <small className="text-[10px] text-[#69868D]">{user?.name || 'thong'}</small>
  </div>;
}

export default function ChatMessageBubble({ message, people = [], currentUser = 'thong', onPay, busy = false }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
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
    <Profile user={person} own={own}/><div className="w-full rounded-[20px] bg-[#F5F5F5] px-3 py-3 text-[#34414C]">
      <div className="flex items-center gap-3">
        <button type="button" aria-expanded={detailsOpen} onClick={() => setDetailsOpen(open => !open)} className="flex min-h-[54px] min-w-0 flex-1 items-center justify-between gap-3 text-left">
          <span className="min-w-0"><b className="block text-sm">เรียกเก็บเงิน</b><span className="text-sm">{message.recipientId === currentUser ? 'คุณ' : recipient?.name}</span></span>
          <span className="flex shrink-0 items-center gap-2"><strong className={'text-lg '+(message.isPaid ? 'text-[#69C9C8]' : 'text-red-500')}>{message.amount.toFixed(2)}</strong><ChevronDown size={18} className={'transition-transform '+(detailsOpen ? 'rotate-180' : '')}/></span>
        </button>
        {message.recipientId === currentUser && <button type="button" onClick={() => onPay?.(message.recipientId)} disabled={busy || message.isPaid} className="flex h-7 min-w-[125px] shrink-0 items-center justify-center gap-1 rounded-lg bg-[#00B8E6] px-3 text-sm text-white disabled:bg-[#69C9C8]">{busy ? <LoaderCircle size={14} className="animate-spin"/> : <Wallet size={14}/>} {message.isPaid ? 'จ่ายแล้ว' : 'จ่ายทันที'}</button>}
      </div>
      {detailsOpen && <div className="mt-2 border-t border-gray-200 pt-2 text-xs">
        {message.details ? <>
          <b className="mb-1 block text-[#34414C]">รายการที่เลือก</b>
          {message.details.items.map((item, index) => <div key={`${item.name}-${index}`} className="mb-2 border-b border-gray-200/80 pb-2 last:border-0">
            <div className="flex justify-between gap-2"><span className="font-medium">{item.name}</span><span>{item.grossAmount.toFixed(2)}</span></div>
            {item.addons?.map((addon, addonIndex) => <div key={`${index}-addon-${addonIndex}`} className="mt-0.5 pl-2 text-gray-500">– {addon}</div>)}
            {item.adjustments?.map((adjustment, adjustmentIndex) => <div key={`${index}-adjustment-${adjustmentIndex}`} className="mt-0.5 flex justify-between gap-2 pl-2 text-rose-600"><span>{adjustment.name}</span><span>{adjustment.amount < 0 ? '−' : '+'}{Math.abs(adjustment.amount).toFixed(2)}</span></div>)}
            {(item.adjustments?.length > 0) && <div className="mt-1 flex justify-between border-t border-gray-100 pt-1 font-semibold"><span>สุทธิรายการ</span><span>{item.amount.toFixed(2)}</span></div>}
          </div>)}
          <div className="flex justify-between border-t border-gray-200 py-1 font-medium"><span>รวมรายการที่เลือก</span><span>{message.details.itemsAmount.toFixed(2)}</span></div>
          {message.details.charges.map((charge, index) => <div key={`${charge.name}-${index}`} className="flex justify-between gap-2 py-1 text-gray-600"><span>{charge.name}</span><span className={charge.amount < 0 ? 'text-rose-600' : ''}>{charge.amount < 0 ? '−' : '+'}{Math.abs(charge.amount).toFixed(2)}</span></div>)}
          <div className="mt-1 flex justify-between border-t border-gray-200 pt-2 font-bold"><span>ยอดเรียกเก็บ</span><span>{message.details.total.toFixed(2)}</span></div>
        </> : <p className="py-2 text-gray-500">ไม่มีรายละเอียดรายการสำหรับบิลนี้</p>}
      </div>}
    </div>
  </div>;

  if (message.type === 'receipt') return <div className={'my-3 flex w-fit max-w-full flex-col '+alignment}>
    <Profile user={person} own={own}/><div className="grid min-h-[82px] w-[min(310px,calc(100vw-48px))] grid-cols-2 gap-x-4 rounded-2xl bg-[#00B8E6] p-3 text-white shadow-sm"><span className="flex items-center gap-1 text-sm font-semibold">{message.amount < 0 ? 'โอนเงิน' : 'โอนเงิน'}</span><b className="text-right text-lg">{message.amount < 0 ? '- ' : '+ '}{Math.abs(message.amount).toFixed(2)}</b><ChevronDown size={18} className="col-span-2 ml-auto"/></div>
  </div>;

  return null;
}
