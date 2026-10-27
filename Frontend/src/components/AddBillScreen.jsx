import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, LoaderCircle, MoreHorizontal, Pencil, Plus, RotateCcw, X } from 'lucide-react';
import { scanReceipt } from '../services/aiService.js';

const makeId = () => crypto.randomUUID();
const emptyItem = () => ({ id: makeId(), name: '', price: '' });

export default function AddBillScreen({ groupName = 'ค่ากิน', onBack, onConfirmBill, onClose, onConfirm, busy = false }) {
  const [receiptImage, setReceiptImage] = useState(null);
  const [items, setItems] = useState([emptyItem()]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const title = groupName || 'ค่ากิน';
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + Math.round((Number(item.price) || 0) * 100), 0) / 100, [items]);

  function updateItem(id, field, value) {
    setItems(current => current.map(item => item.id === id ? { ...item, [field]: value } : item));
  }

  async function loadImage(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('กรุณาเลือกไฟล์รูปภาพ'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('ขนาดรูปต้องไม่เกิน 10 MB'); return; }
    setError('');
    let imageUrl;
    try {
      imageUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('อ่านไฟล์รูปไม่สำเร็จ'));
        reader.readAsDataURL(file);
      });
    } catch (cause) { setError(cause.message); return; }
    setReceiptImage(imageUrl);
    setScanning(true);
    try {
      const extracted = await scanReceipt(imageUrl);
      setItems(extracted.map(item => ({ ...item, price: String(item.price) })));
    } catch (cause) { setError(cause.message || 'อ่านใบเสร็จไม่สำเร็จ'); }
    finally { setScanning(false); }
  }

  function addItem() { setItems(current => [...current, emptyItem()]); }
  function removeItem(id) { setItems(current => current.length > 1 ? current.filter(item => item.id !== id) : [emptyItem()]); }

  async function confirm() {
    setError('');
    const validItems = items.map(item => ({ ...item, name: item.name.trim(), price: Number(item.price) }));
    if (!validItems.length || validItems.some(item => !item.name || !Number.isFinite(item.price) || item.price < 0 || item.price > 1000000)) {
      setError('กรุณากรอกชื่อและราคาของทุกรายการให้ถูกต้อง');
      return;
    }
    const result = { title, items: validItems.map(item => ({ ...item, assignedUserIds: [] })), totalAmount, receiptImageUrl: receiptImage };
    const callback = onConfirmBill || onConfirm;
    try { await callback?.(result); }
    catch (cause) { setError(cause.message || 'บันทึกบิลไม่สำเร็จ'); }
  }

  return <main className="fixed inset-0 z-30 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-y-auto bg-white text-[#1A3048] shadow-2xl">
    <header className="relative z-10 flex h-[100px] shrink-0 items-center justify-between bg-[#8AE3FF] px-3">
      <button type="button" aria-label="Back" onClick={onBack || onClose} className="grid h-10 w-10 place-items-center text-[#00B8E6] hover:opacity-80"><ArrowLeft size={25}/></button>
      <h1 className="flex-1 pr-6 text-center text-xl font-bold">{title}</h1>
      <button type="button" aria-label="More options" className="grid h-10 w-8 place-items-center text-xl text-[#00B8E6]"><MoreHorizontal size={22}/></button>
    </header>

    <section className="relative h-[280px] shrink-0 bg-white">
      <div className="absolute inset-x-0 top-0 h-[149px] bg-[#8AE3FF]" />
      <button type="button" onClick={() => inputRef.current?.click()} className="absolute left-1/2 top-[25px] flex h-[228px] w-[205px] -translate-x-1/2 flex-col items-center justify-center overflow-hidden rounded-[22px] border border-gray-100 bg-white shadow-md">
        {receiptImage ? <img src={receiptImage} alt="Uploaded receipt" className="h-full w-full rounded-[22px] object-cover"/> : <><Camera size={39} strokeWidth={1.5} className="mb-1 text-[#7896A0]"/><span className="text-sm font-medium text-[#7896A0]">เพิ่มรูป</span></>}
        <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={event => loadImage(event.target.files?.[0])}/>
      </button>
      <button type="button" aria-label="Upload or rescan receipt" onClick={() => inputRef.current?.click()} className="absolute left-[calc(50%+143px)] top-[182px] grid h-9 w-9 place-items-center rounded-full bg-[#00B8E6] text-white shadow-sm hover:bg-[#00A3CC]"><RotateCcw size={20}/></button>
      {scanning && <span className="absolute left-1/2 top-[267px] z-10 -translate-x-1/2 rounded-full bg-white/95 px-2 py-1 text-[10px] text-[#56838C]"><LoaderCircle size={12} className="mr-1 inline animate-spin"/>กำลังอ่านใบเสร็จ</span>}
    </section>

    <section className="flex min-h-[280px] flex-1 flex-col px-[29px] pb-3">
      <div className="flex h-[43px] shrink-0 items-center justify-between border-b border-gray-200">
        <h2 className="text-base font-bold text-gray-800">รายการ</h2>
        <button type="button" aria-label="Edit items" className="grid h-8 w-8 place-items-center rounded-full bg-[#00B8E6] text-white shadow-sm"><Pencil size={15}/></button>
      </div>
      <div className="pt-5">
        {items.map(item => <div key={item.id} className="my-2 flex items-center gap-3">
          <input aria-label="ชื่อรายการ" value={item.name} onChange={event => updateItem(item.id, 'name', event.target.value)} placeholder="" maxLength={80} className="min-w-0 flex-1 border-b border-gray-400 bg-transparent py-0 text-sm leading-4 text-gray-800 outline-none transition-colors focus:border-[#00B8E6] placeholder:text-gray-300"/>
          <input aria-label="ราคา" type="number" min="0" max="1000000" step="0.01" value={item.price} onChange={event => updateItem(item.id, 'price', event.target.value)} placeholder="" className="w-[67px] border-b border-gray-400 bg-transparent py-0 text-right text-sm font-semibold leading-4 text-gray-800 outline-none transition-colors focus:border-[#00B8E6] placeholder:text-gray-300"/>
          <button type="button" aria-label="ลบรายการ" onClick={() => removeItem(item.id)} className="ml-1 text-sm text-gray-400 hover:text-red-500"><X size={16}/></button>
        </div>)}
        <button type="button" onClick={addItem} className="mt-2 inline-flex items-center text-sm font-semibold text-[#00B8E6] underline">+ เพิ่มรายการ</button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-500">{error}</p>}
      <div className="mt-auto flex items-center justify-between border-y border-gray-200 px-0 py-4">
        <span className="text-base font-bold text-gray-800">ยอดรวม</span><strong className="text-xl font-bold text-gray-900">{totalAmount.toFixed(2)}</strong>
      </div>
    </section>

    <footer className="flex h-[86px] shrink-0 items-start justify-center bg-white pt-4">
      <button type="button" disabled={busy || scanning} onClick={confirm} className="h-[34px] w-[124px] rounded-full bg-[#00B8E6] text-lg font-bold text-white transition-colors hover:bg-[#00A3CC] disabled:opacity-60">ยืนยัน</button>
    </footer>
  </main>;
}

