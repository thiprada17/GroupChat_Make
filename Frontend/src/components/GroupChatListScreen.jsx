import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';

const defaultGroups = [
  { id: 'food', name: 'ค่ากิน' },
  { id: 'abc-1', name: 'abc' },
  { id: 'chathai', name: 'ChaThai' },
  { id: 'abc-2', name: 'abc' },
  { id: 'abc-3', name: 'abc' },
  { id: 'abc-4', name: 'abc' },
  { id: 'abc-5', name: 'abc' },
];

export default function GroupChatListScreen({ onBack, onSelectGroup, onCreateGroup, groups = defaultGroups }) {
  const [query, setQuery] = useState('');
  const visibleGroups = useMemo(() => groups.filter(group => group.name.toLowerCase().includes(query.trim().toLowerCase())), [groups, query]);

  return <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-white pb-24 text-[#1A3048]">
    <header className="relative h-[161px] shrink-0 bg-[#8AE3FF] px-4 shadow-sm">
      <div className="absolute inset-x-2 top-[55px] flex h-10 items-center">
        <button type="button" aria-label="Back" onClick={onBack} className="grid h-10 w-10 place-items-center text-2xl text-[#00B8E6] transition-opacity hover:opacity-80"><ArrowLeft size={25} strokeWidth={2}/></button>
        <h1 className="flex-1 pr-6 text-center text-xl font-bold text-[#1A3048]">Group Chat</h1>
      </div>
      <label className="absolute inset-x-4 top-[111px] flex h-[26px] items-center gap-2 rounded-md bg-white px-2.5 shadow-inner">
        <Search size={15} className="shrink-0 text-gray-400"/>
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="ค้นหาชื่อกลุ่ม" className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400" />
      </label>
    </header>

    <section aria-label="Group chats" className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-4 gap-x-2 gap-y-8 px-3 pt-10">
        {visibleGroups.map(group => <button type="button" key={group.id} onClick={() => onSelectGroup(group.id)} className="min-w-0 text-center">
          <span className="mx-auto block h-[50px] w-[50px] rounded-full bg-[#D9D9D9] transition-opacity hover:opacity-90" />
          <span className="mt-2 block truncate text-center text-sm font-normal text-gray-700">{group.name}</span>
        </button>)}
        {visibleGroups.length === 0 && <p className="col-span-4 py-8 text-center text-sm text-gray-400">ไม่พบ Group Chat</p>}
      </div>
    </section>

    <footer className="fixed inset-x-0 bottom-0 mx-auto flex h-[97px] w-full max-w-md items-center justify-center bg-[#8AE3FF]">
      <button type="button" onClick={onCreateGroup} className="flex h-[34px] w-[min(202px,calc(100%-48px))] items-center justify-center rounded-full bg-[#00B8E6] text-lg font-bold text-white shadow-md transition-colors hover:bg-[#00A3CC]">เพิ่ม Group Chat</button>
    </footer>
  </main>;
}
