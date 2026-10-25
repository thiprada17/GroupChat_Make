import React, { useState } from 'react';
import { ArrowLeft, Cloud, Plus } from 'lucide-react';
import GroupCreateScreen from './components/GroupCreateScreen.jsx';
import GroupChatScreen from './components/GroupChatScreen.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import GroupChatListScreen from './components/GroupChatListScreen.jsx';

export const CONTACTS = [
  { id: 'nadia', name: 'nadia', color: '#ffc95e' },
  { id: 'jinny', name: 'jinny', color: '#39824c' },
  { id: 'abc', name: 'abc', color: '#cbd0d2' },
];
export const INITIAL_MEMBERS = [
  { id: 'thong', name: 'thong', color: '#294e74' },
  ...CONTACTS.slice(0, 2),
];

const demoGroups = {
  food: { name: 'ค่ากิน', members: ['thong', 'nadia', 'jinny'] },
  'abc-1': { name: 'abc', members: ['thong', 'jinny', 'abc'] },
  chathai: { name: 'ChaThai', members: ['thong', 'nadia', 'jinny', 'abc'] },
  'abc-2': { name: 'abc', members: ['thong', 'jinny', 'abc'] },
  'abc-3': { name: 'abc', members: ['thong', 'nadia', 'abc'] },
  'abc-4': { name: 'abc', members: ['thong', 'nadia', 'jinny'] },
  'abc-5': { name: 'abc', members: ['thong', 'jinny', 'abc'] },
};

export default function App() {
  const [screen, setScreen] = useState('home');
  const [group, setGroup] = useState({ name: 'ค่ากิน', members: INITIAL_MEMBERS });
  const [pocketId, setPocketId] = useState('');

  function selectGroup(groupId) {
    const chosen = demoGroups[groupId] || demoGroups.food;
    const members = chosen.members.map(id => [...INITIAL_MEMBERS, ...CONTACTS].find(person => person.id === id)).filter(Boolean);
    setGroup({ name: chosen.name, members });
    setScreen('chat');
  }

  if (screen === 'create') return <GroupCreateScreen contacts={CONTACTS} onBack={() => setScreen('home')} onGroupCreated={created => { setGroup(created); setScreen('chat'); }} />;
  if (screen === 'chat') return <GroupChatScreen group={group} onBack={() => setScreen('home')} />;
  if (screen === 'groups') return <GroupChatListScreen onBack={() => setScreen('home')} onSelectGroup={selectGroup} onCreateGroup={() => setScreen('create')} />;
  if (screen === 'pocket') return <main className="mx-auto min-h-screen max-w-md bg-white p-5"><button className="mb-8 text-cyan-600" onClick={() => setScreen('home')}><ArrowLeft /></button><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#E8F8FF] text-cyan-500"><Cloud /></span><h1 className="mt-4 text-center text-xl font-bold text-gray-800">Cloud Pocket</h1><p className="mt-2 text-center text-sm text-gray-500">{pocketId === 'create' ? 'สร้าง Cloud Pocket' : 'abc'}</p><button className="mx-auto mt-8 flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-white" onClick={() => setPocketId('create')}><Plus size={18}/> เพิ่ม Cloud</button></main>;

  return <HomeScreen onSelectGroup={selectGroup} onCreateGroup={() => setScreen('create')} onSelectPocket={id => { setPocketId(id); setScreen('pocket'); }} onViewAllGroups={() => setScreen('groups')} />;
}
