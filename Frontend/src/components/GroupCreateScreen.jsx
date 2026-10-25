import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Pencil, Plus, Search, UserRound } from 'lucide-react';

const fallbackContacts = [
  { id: 'nadia', name: 'nadia', color: '#F2C04D' },
  { id: 'jinny', name: 'jinny', color: '#387F47' },
  { id: 'abc', name: 'abc', color: '#C0C0C0' },
];
const creator = { id: 'thong', name: 'thong', color: '#294E74' };

function Avatar({ user, size = 40 }) {
  return <span aria-hidden="true" className="grid shrink-0 place-items-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: user.color || user.avatarColor || '#C0C0C0', width: size, height: size }}>{user.id === creator.id ? 't' : ''}</span>;
}

function EditButton({ onClick, label }) {
  return <button type="button" aria-label={label} onClick={onClick} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#00B8E6] text-white hover:bg-[#00A3CC]"><Pencil size={16} strokeWidth={2.2}/></button>;
}

export default function GroupCreateScreen({ contacts = fallbackContacts, onBack, onGroupCreated, onCreate }) {
  const [step, setStep] = useState(1);
  const [selectedMemberIds, setSelectedMemberIds] = useState(['nadia', 'jinny']);
  const [groupName, setGroupName] = useState('ค่ากิน');
  const [query, setQuery] = useState('');
  const visibleContacts = useMemo(() => contacts.filter(user => `${user.name} ${user.phone || ''}`.toLowerCase().includes(query.trim().toLowerCase())), [contacts, query]);
  const selectedMembers = contacts.filter(user => selectedMemberIds.includes(user.id));

  function toggleMember(id) {
    setSelectedMemberIds(current => current.includes(id) ? current.filter(memberId => memberId !== id) : [...current, id]);
  }

  function createGroup() {
    const name = groupName.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 40) || 'ค่ากิน';
    const members = [creator, ...selectedMembers];
    const callback = onGroupCreated || onCreate;
    callback?.({ id: crypto.randomUUID(), name, members });
  }

  return <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-white pb-24 text-[#1A3048]">
    <header className={'relative shrink-0 bg-[#8AE3FF] shadow-sm '+(step === 1 ? 'h-[161px]' : 'h-[105px]')}>
      <div className="absolute inset-x-2 top-[55px] flex h-10 items-center">
        <button type="button" aria-label="Back" onClick={() => step === 2 ? setStep(1) : onBack?.()} className="grid h-10 w-10 place-items-center text-[#00B8E6]"><ArrowLeft size={25} strokeWidth={2}/></button>
        <h1 className="flex-1 pr-6 text-center text-lg font-bold text-[#1A3048]">เพิ่มสมาชิก</h1>
      </div>
      {step === 1 && <div className="absolute inset-x-4 top-[111px]">
        <label className="flex h-[26px] items-center gap-2 rounded-md bg-white px-2.5 shadow-inner">
          <Search size={16} className="shrink-0 text-gray-400"/>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="ค้นหาชื่อ" className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400" />
        </label>
      </div>}
    </header>

    {step === 1 ? <>
      <button type="button" className="flex items-center gap-3 border-b border-gray-100 p-4 text-left hover:bg-gray-50">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E8F8FF] text-[#00B8E6]"><Plus size={28} strokeWidth={1.3}/></span>
        <span><b className="block text-base font-bold text-[#00B8E6]">เพิ่มผู้ใช้งาน</b><small className="block text-xs text-gray-400">ค้นหาด้วยเบอร์โทรศัพท์</small></span>
      </button>
      <section className="px-4">
        <h2 className="pb-2 pt-4 text-base font-bold text-gray-800">สมาชิก</h2>
        {visibleContacts.map(user => {
          const checked = selectedMemberIds.includes(user.id);
          return <button type="button" key={user.id} aria-pressed={checked} onClick={() => toggleMember(user.id)} className="flex h-16 w-full items-center border-b border-gray-200 text-left">
            <Avatar user={user} size={40}/><span className="ml-3 flex-1 text-base font-medium text-[#1A3048]">{user.name}</span>
            <span className={'mr-1 grid h-5 w-5 place-items-center rounded-md border '+(checked ? 'border-[#4DB6AC] bg-[#4DB6AC] text-white' : 'border-[#8ADBD9] bg-white text-transparent')}><Check size={14} strokeWidth={3}/></span>
          </button>;
        })}
      </section>
      <footer className="fixed inset-x-0 bottom-0 mx-auto flex h-[97px] w-full max-w-md items-center justify-center bg-[#8AE3FF]">
        <button type="button" disabled={!selectedMemberIds.length} onClick={() => setStep(2)} className="h-[34px] w-[min(202px,calc(100%-48px))] rounded-full bg-[#00B8E6] text-lg font-bold text-white shadow-md transition-colors hover:bg-[#00A3CC] disabled:opacity-50">ต่อไป</button>
      </footer>
    </> : <>
      <section className="px-4 pt-6">
        <div className="flex items-center gap-4 border-b border-gray-200 px-1 pb-6">
          <span className="h-16 w-16 shrink-0 rounded-full" style={{ background: 'conic-gradient(#387F47 0 25%, #F2C04D 25% 50%, #FFFFFF 50% 75%, #294E74 75% 100%)' }}/>
          <label className="min-w-0 flex-1 text-xs text-gray-400">ชื่อกลุ่ม
            <input aria-label="ชื่อกลุ่ม" value={groupName} onChange={event => setGroupName(event.target.value)} maxLength={40} className="block w-full border-b border-transparent bg-transparent py-1 text-xl font-bold text-[#1A3048] outline-none focus:border-[#00B8E6]" />
          </label>
          <EditButton label="แก้ไขชื่อกลุ่ม" onClick={() => document.querySelector('input[aria-label="ชื่อกลุ่ม"]')?.focus()} />
        </div>
        <div className="flex items-start gap-4 px-1 py-7">
          <UserRound size={19} className="mt-1 shrink-0 text-[#1A3048]" strokeWidth={1.8}/>
          <div className="min-w-0 flex-1">
            <b className="block text-base font-bold text-gray-800">สมาชิก</b>
            <small className="mt-1 block text-xs text-gray-400">จัดการเงินร่วมกับเพื่อนของคุณ</small>
            <div className="mt-3 flex items-center pl-2">
              {[...selectedMembers].reverse().map((user, index) => <span key={user.id} className={index ? '-ml-2' : ''}><Avatar user={user} size={40}/></span>)}
              <span className="-ml-2"><Avatar user={creator} size={40}/></span>
            </div>
          </div>
          <EditButton label="แก้ไขสมาชิก" onClick={() => setStep(1)} />
        </div>
      </section>
      <footer className="fixed inset-x-0 bottom-0 mx-auto flex h-[97px] w-full max-w-md items-center justify-center bg-[#8AE3FF]">
        <button type="button" onClick={createGroup} className="h-[34px] w-[min(202px,calc(100%-48px))] rounded-full bg-[#00B8E6] text-lg font-bold text-white shadow-md transition-colors hover:bg-[#00A3CC]">สร้าง</button>
      </footer>
    </>}
  </main>;
}
