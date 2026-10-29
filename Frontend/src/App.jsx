import React, { useEffect, useState } from 'react';
import { ArrowLeft, Cloud, Plus } from 'lucide-react';
import GroupCreateScreen from './components/GroupCreateScreen.jsx';
import GroupChatScreen from './components/GroupChatScreen.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import GroupChatListScreen from './components/GroupChatListScreen.jsx';

const GROUPS_STORAGE_KEY = 'groupchat.groups.v1';

export const CONTACTS = [
  { id: 'nadia', name: 'nadia', color: '#ffdf9f' },
  { id: 'jinny', name: 'jinny', color: '#7db2a4' },
  { id: 'user4', name: 'user4', color: '#c05c5c' },
  { id: 'user5', name: 'user5', color: 'rgb(194, 121, 185)' },
];
export const INITIAL_MEMBERS = [
  { id: 'thong', name: 'thong', color: '#3d6994' },
  ...CONTACTS,
];

const defaultGroups = [{ id: 'chathai', name: 'ChaThai', members: INITIAL_MEMBERS, createdById: 'thong' }];

function loadGroups() {
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (raw !== null) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved)) return saved;
    }
  } catch { /* Use the initial group when storage is empty or invalid. */ }
  return defaultGroups;
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [groups, setGroups] = useState(loadGroups);
  const [group, setGroup] = useState(() => loadGroups()[0]);
  const [pocketId, setPocketId] = useState('');

  useEffect(() => {
    try { localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups)); } catch { /* The app remains usable if storage is unavailable. */ }
  }, [groups]);

  function saveGroup(updatedGroup) {
    setGroup(updatedGroup);
    setGroups(current => current.map(item => item.id === updatedGroup.id ? updatedGroup : item));
  }

  function updateManagedGroup(updatedGroup) {
    saveGroup(updatedGroup);
    setScreen('settings');
  }

  function selectGroup(groupId) {
    const chosen = groups.find(item => item.id === groupId);
    if (!chosen) return;
    setGroup(chosen);
    setScreen('chat');
  }

  function createGroup(created) {
    setGroups(current => [created, ...current.filter(item => item.id !== created.id)]);
    setGroup(created);
    setScreen('chat');
  }

  if (screen === 'create') return <GroupCreateScreen contacts={CONTACTS} onBack={() => setScreen('home')} onGroupCreated={createGroup} />;
  if ((screen === 'chat' || screen === 'settings' || screen === 'manage') && group) return <GroupChatScreen key={group.id} group={group} view={screen} contacts={CONTACTS} onBack={() => setScreen('home')} onOpenSettings={() => setScreen('settings')} onCloseSettings={() => setScreen('chat')} onManageBack={() => setScreen('settings')} onEditGroupName={() => { const name = window.prompt('ชื่อกลุ่ม', group.name); if (name?.trim()) saveGroup({ ...group, name: name.trim().slice(0, 40) }); }} onManageMembers={() => setScreen('manage')} onDeleteGroup={groupId => { setGroups(current => current.filter(item => item.id !== groupId)); setGroup(undefined); setScreen('home'); }} onManageComplete={updateManagedGroup} />;
  if (screen === 'groups') return <GroupChatListScreen groups={groups} onBack={() => setScreen('home')} onSelectGroup={selectGroup} onCreateGroup={() => setScreen('create')} />;
  if (screen === 'pocket') return <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-white p-5"><button className="mb-8 text-cyan-600" onClick={() => setScreen('home')}><ArrowLeft /></button><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#E8F8FF] text-cyan-500"><Cloud /></span><h1 className="mt-4 text-center text-xl font-bold text-gray-800">Cloud Pocket</h1><p className="mt-2 text-center text-sm text-gray-500">{pocketId === 'create' ? 'สร้าง Cloud Pocket' : 'abc'}</p><button className="mx-auto mt-8 flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-white" onClick={() => setPocketId('create')}><Plus size={18}/> เพิ่ม Cloud</button></main>;

  return <HomeScreen groups={groups} onSelectGroup={selectGroup} onCreateGroup={() => setScreen('create')} onSelectPocket={id => { setPocketId(id); setScreen('pocket'); }} onViewAllGroups={() => setScreen('groups')} />;
}
