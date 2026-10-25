import React from 'react';
import { Check, CheckCheck, LoaderCircle, Pencil } from 'lucide-react';

const money = value => (Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2);
function Avatar({ user, size = 21 }) {
  return <span aria-hidden="true" className="grid shrink-0 place-items-center rounded-full border-2 border-white text-[8px] font-bold text-white" style={{ background: user.color || user.avatarColor || '#204066', width: size, height: size }}>{user.id === 'thong' ? 't' : ''}</span>;
}

export default function BillSessionCard({ date = '22/10/2026', restaurant = 'รวมแซ่บยกครก', items, members, memberSummaries = [], status, shares, total, currentUser, creatorId = 'thong', paid = {}, busy, onToggle, onClose, onEdit }) {
  const currentUserId = typeof currentUser === 'string' ? currentUser : currentUser?.id;
  const isCreator = currentUserId === creatorId;
  return <article className="w-full rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
    <header className="flex items-start justify-between border-b border-gray-200 pb-3">
      <div><h3 className="text-base font-bold text-[#4DB6AC]">บิลวันที่ {date}</h3><small className="text-[11px] text-[#82CECB]">{restaurant}</small></div>
      <div className="flex -space-x-1.5 pt-1">{members.slice(0, 3).map(user => <Avatar key={user.id} user={user} size={23}/>)}</div>
    </header>

    {status === 'open' ? <>
      <div className="py-2">{items.map(item => <div key={item.id} className="flex min-h-[51px] items-center gap-2">
        <button type="button" aria-label={`เลือก ${item.name}`} aria-pressed={(item.assignedUserIds || []).includes(currentUserId)} onClick={() => onToggle(item.id, currentUserId)} className={'grid h-[19px] w-[19px] shrink-0 place-items-center rounded-md border '+((item.assignedUserIds || []).includes(currentUserId) ? 'border-[#82D2D1] bg-[#82D2D1] text-white' : 'border-[#81969E] bg-white text-transparent')}><Check size={13} strokeWidth={3}/></button>
        <span className="min-w-0 flex-1 text-[13px] leading-tight text-[#34414C]">{item.name}</span>
        <span className="min-w-[58px] text-right"><b className="text-[13px] font-medium">{money(item.price)}</b>{item.assignedUserIds.length > 0 && <small className="block text-[10px] leading-none text-[#4DB6AC]">/{item.assignedUserIds.length}</small>}<small className="block w-fit min-w-[38px] rounded-sm bg-[#82D2D1] px-1 text-center text-[9px] leading-tight text-white">{item.assignedUserIds.length > 0 ? money(item.price / item.assignedUserIds.length) : money(item.price)}</small></span>
        <span className="flex min-w-[42px] justify-end">{(item.assignedUserIds || []).map(id => { const user = members.find(person => person.id === id); return user && <span key={id} className="-ml-1"><Avatar user={user} size={21}/></span>; })}</span>
      </div>)}</div>
      <div className="flex justify-between border-t border-gray-200 py-2.5 text-xs font-bold"><span>ยอดรวม</span><b>{money(total)}</b></div>
      {isCreator && <div className="flex gap-2"><button type="button" onClick={onClose} disabled={busy} className="flex h-[34px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#00B8E6] text-sm font-bold text-white disabled:opacity-60">{busy ? <LoaderCircle size={16} className="animate-spin"/> : <CheckCheck size={16}/>} ปิด Session</button><button type="button" aria-label="แก้ไขบิล" onClick={onEdit} className="grid h-[36px] w-[36px] place-items-center rounded-xl border border-gray-100 bg-white text-[#00B8E6] shadow-sm"><Pencil size={17}/></button></div>}
    </> : <div className="pt-2">{memberSummaries.map(summary => { const person = members.find(member => member.id === summary.userId); if (!person) return null; const isPaid = Boolean(summary.isPaid || paid[summary.userId]); return <div key={summary.userId} className="flex h-[42px] items-center gap-3">
      <span className={'rounded-full px-3 py-1 text-[10px] font-bold text-white '+(isPaid ? 'bg-[#4DB6AC]' : 'bg-[#E53935]')}>{isPaid ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}</span><Avatar user={person} size={21}/><span className="flex-1 text-sm">{summary.userId === currentUserId ? 'คุณ' : summary.name}</span><strong className="text-lg text-[#343E49]">{money(summary.totalAmount)}</strong>
    </div>; })}</div>}
  </article>;
}
