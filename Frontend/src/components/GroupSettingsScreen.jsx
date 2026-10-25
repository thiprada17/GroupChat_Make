import React from 'react';
import { ArrowLeft, Pencil, Trash2, UserRound } from 'lucide-react';

function SegmentedAvatar({ members = [] }) {
  const colors = members.map(person => person.color || person.avatarColor).filter(Boolean);
  const palette = [colors.find(color => color.toLowerCase() === '#294e74' || color.toLowerCase() === '#204066') || '#294E74', colors.find(color => color.toLowerCase() === '#387f47' || color.toLowerCase() === '#39824c') || '#387F47', colors.find(color => color.toLowerCase() === '#f2c04d' || color.toLowerCase() === '#ffc95e') || '#F2C04D'];
  return <span aria-hidden="true" className="h-16 w-16 shrink-0 rounded-full" style={{ background: `conic-gradient(${palette[1]} 0 25%, ${palette[2]} 25% 50%, #FFFFFF 50% 75%, ${palette[0]} 75% 100%)` }} />;
}

function EditButton({ label, onClick }) {
  return <button type="button" aria-label={label} onClick={onClick} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#00B8E6] text-white hover:bg-[#00A3CC]"><Pencil size={17}/></button>;
}

export default function GroupSettingsScreen({ group, onBack, onEditGroupName, onManageMembers, onDeleteGroup }) {
  const members = group?.members || [];
  return <main className="mx-auto min-h-screen w-full max-w-md bg-white text-[#1A3048]">
    <header className="h-[249px] bg-[#8AE3FF] px-4 pt-[55px]">
      <button type="button" aria-label="Back" onClick={onBack} className="-ml-1 grid h-10 w-10 place-items-center text-2xl text-[#00B8E6] hover:opacity-80"><ArrowLeft size={25}/></button>
      <h1 className="mt-1 text-xl font-bold">ตั้งค่า</h1>
      <div className="mt-6 flex items-center gap-4">
        <SegmentedAvatar members={members}/>
        <div className="min-w-0 flex-1"><small className="block text-xs font-medium text-[#007B99]">ชื่อกลุ่ม</small><h2 className="truncate text-2xl font-bold text-[#1A3048]">{group?.name || 'ค่ากิน'}</h2></div>
        <EditButton label="แก้ไขชื่อกลุ่ม" onClick={onEditGroupName}/>
      </div>
    </header>

    <section className="px-[27px] pt-11">
      <div className="flex items-start gap-4">
        <UserRound size={19} className="mt-1 shrink-0 text-[#263541]" strokeWidth={1.8}/>
        <div className="min-w-0 flex-1">
          <b className="block text-base font-bold text-gray-800">สมาชิก</b>
          <small className="mt-1 block text-xs text-[#6E8A93]">จัดการเงินร่วมกับเพื่อนของคุณ</small>
          <div className="mt-2 flex items-center pl-2">{[...members].reverse().slice(0, 5).map((person, index) => <span key={person.id} className={index ? '-ml-2' : ''}><span aria-hidden="true" className="block h-10 w-10 rounded-full border-2 border-white" style={{ background: person.color || person.avatarColor || '#C0C0C0' }}/></span>)}</div>
        </div>
        <EditButton label="จัดการสมาชิก" onClick={onManageMembers}/>
      </div>

      <div className="mt-[42px] border-t border-gray-200 pt-4">
        <button type="button" onClick={() => onDeleteGroup?.(group.id)} className="flex items-center gap-4 text-sm font-semibold text-[#E53935] hover:text-red-700"><Trash2 size={18} strokeWidth={1.8}/>ลบ Group Chat</button>
      </div>
    </section>
  </main>;
}
