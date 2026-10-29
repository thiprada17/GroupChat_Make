import React from 'react';
import { ChevronRight, Home, Plus, ReceiptText, ScanLine, Wallet } from 'lucide-react';
import GroupAvatar from './GroupAvatar.jsx';

const pockets = [
  { id: 'pocket-1', label: 'ค่ากิน' },
  { id: 'pocket-2', label: 'ค่าเที่ยว' },
  { id: 'pocket-3', label: 'เก็บออม' },
];

function MoreLink({ onClick }) {
  return <button type="button" onClick={onClick} className="flex items-center gap-1 text-sm font-medium text-[#00B8E6]">ดูทั้งหมด <ChevronRight size={17} strokeWidth={1.8} /></button>;
}

function PlusMark({ size = 'group' }) {
  const length = size === 'cloud' ? '61%' : '58%';
  return <span aria-hidden="true" className="relative block h-full w-full">
    <span className="absolute left-1/2 top-1/2 h-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00B8E6]" style={{ width: length }} />
    <span className="absolute left-1/2 top-1/2 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00B8E6]" style={{ height: length }} />
  </span>;
}

function GroupTile({ group, onClick }) {
  return <button type="button" onClick={() => onClick(group.id)} className="group min-w-0 text-center">
    <GroupAvatar members={group.members} size={64} className="mx-auto transition-opacity group-hover:opacity-90" />
    <span className="mt-2 block text-center text-sm font-medium text-gray-700">{group.label}</span>
  </button>;
}

function PocketTile({ pocket, onClick }) {
  return <button type="button" onClick={() => onClick(pocket.id)} className="group min-w-0 text-center">
    <span className="mx-auto block h-14 w-14 rounded-2xl bg-[#D9D9D9] shadow-sm transition-opacity group-hover:opacity-90" />
    <span className="mt-2 block text-center text-xs font-medium text-gray-700">{pocket.label}</span>
  </button>;
}

function BottomNavigation() {
  return <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-md items-end justify-around rounded-t-3xl bg-[#8AE3FF] px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-lg">
    <button type="button" aria-current="page" className="min-w-[58px] text-center"><span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#00B8E6] to-[#A8F0E5] text-white"><Home size={19} strokeWidth={1.7}/></span><span className="mt-1 block text-xs font-bold text-[#00B8E6]">Home</span></button>
    <button type="button" className="min-w-[66px] text-center"><span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white"><Wallet size={16} className="text-[#007B99]" strokeWidth={1.7}/></span><span className="mt-1 block text-[11px] text-[#007B99]">Cloud pocket</span></button>
    <button type="button" className="min-w-[54px] text-center"><span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-amber-300 to-orange-400"><Wallet size={16} className="text-white" strokeWidth={1.7}/></span><span className="mt-1 block text-[11px] text-[#007B99]">Banking</span></button>
    <button type="button" className="min-w-[44px] text-center"><span className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#27B5B5] text-white"><ScanLine size={17}/></span><span className="mt-1 block text-[11px] text-[#007B99]">Scan</span></button>
    <button type="button" className="min-w-[64px] text-center"><span className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#B98764] text-white"><ReceiptText size={16}/></span><span className="mt-1 block text-[11px] text-[#007B99]">Notification</span></button>
  </nav>;
}

export default function HomeScreen({ groups = [], onSelectGroup, onCreateGroup, onSelectPocket, onViewAllGroups = () => {} }) {
  return <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-between bg-white pb-24">
    <div className="h-[34vh] min-h-[190px] shrink-0" aria-hidden="true" />
    <div>
      <section aria-labelledby="group-chat-heading" className="border-t border-gray-300 pb-5 pt-5">
        <div className="mb-2 flex items-center justify-between px-6">
          <h1 id="group-chat-heading" className="text-xl font-bold text-gray-800">Group Chat</h1>
          <MoreLink onClick={onViewAllGroups} />
        </div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-6 px-6 py-4">
          {groups.map(group => <GroupTile key={group.id} group={{ ...group, label: group.name }} onClick={onSelectGroup} />)}
          <button type="button" onClick={onCreateGroup} className="min-w-0 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E9ECF1]"><PlusMark/></span>
            <span className="mt-2 block text-center text-xs font-semibold text-gray-700">สร้าง<br/>Group Chat</span>
          </button>
        </div>
      </section>
      <section aria-labelledby="cloud-pocket-heading" className="border-t border-gray-300 pb-5 pt-5">
        <div className="mb-1 flex items-center justify-between px-6">
          <h2 id="cloud-pocket-heading" className="text-xl font-bold text-gray-800">Cloud Pocket</h2>
          <MoreLink onClick={() => pockets[0] && onSelectPocket(pockets[0].id)} />
        </div>
        <div className="grid grid-cols-4 gap-4 px-6 py-4">
          {pockets.map(pocket => <PocketTile key={pocket.id} pocket={pocket} onClick={onSelectPocket} />)}
          <button type="button" className="min-w-0 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E9ECF1]"><PlusMark size="cloud"/></span>
            <span className="mt-2 block text-center text-xs font-semibold text-gray-700">สร้าง<br/>Cloud</span>
          </button>
        </div>
      </section>
    </div>
    <BottomNavigation />
  </main>;
}
