import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Camera, LoaderCircle, MoreHorizontal, Plus, RotateCcw, X } from 'lucide-react';
import { scanReceipt } from '../services/aiService.js';

const makeId = () => crypto.randomUUID();
const emptyItem = () => ({ id: makeId(), name: '', price: '', addons: [] });
const cents = amount => Math.round((Number(amount) || 0) * 100);
const itemGrossCents = item => cents(item.price);
const itemNetCents = item => cents(item.price) + (item.adjustments || []).reduce((sum, adjustment) => sum + cents(adjustment.amount), 0);

export default function AddBillScreen({ groupName = 'ค่ากิน', initialBill, onBack, onConfirmBill, onUpdateBill, onClose, onConfirm, busy = false }) {
  const [receiptImage, setReceiptImage] = useState(() => initialBill?.receiptImageUrl || null);
  const [items, setItems] = useState(() => initialBill?.items?.length
    ? initialBill.items.map(item => ({ ...item, price: String(item.price), addons: item.addons || [], adjustments: (item.adjustments || []).map(adjustment => ({ ...adjustment, id: adjustment.id || makeId() })) }))
    : [emptyItem()]);
  const [charges, setCharges] = useState(() => (initialBill?.charges || []).map(charge => ({ ...charge, id: charge.id || makeId() })));
  const [receiptSummary, setReceiptSummary] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanModal, setScanModal] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const title = initialBill?.title || groupName || 'ค่ากิน';
  const totalAmount = useMemo(() => {
    const itemTotal = items.reduce((sum, item) => sum + itemNetCents(item), 0);
    const chargeTotal = charges.reduce((sum, charge) => sum + cents(charge.amount), 0);
    return (itemTotal + chargeTotal) / 100;
  }, [items, charges]);
  const itemsGrossSubtotal = items.reduce((sum, item) => sum + itemGrossCents(item), 0) / 100;
  const itemsNetSubtotal = items.reduce((sum, item) => sum + itemNetCents(item), 0) / 100;
  const subtotalMismatch = receiptSummary?.subtotal > 0
    && Math.abs(cents(receiptSummary.subtotal) - cents(itemsGrossSubtotal)) > 1
    && Math.abs(cents(receiptSummary.subtotal) - cents(itemsNetSubtotal)) > 1;
  const totalMismatch = receiptSummary?.receiptTotal > 0 && Math.abs(cents(receiptSummary.receiptTotal) - cents(totalAmount)) > 1;

  function updateItem(id, field, value) {
    setItems(current => current.map(item => item.id === id ? { ...item, [field]: value } : item));
  }

  function updateCharge(id, amount) {
    setCharges(current => current.map(charge => charge.id === id ? { ...charge, amount } : charge));
  }

  function updateItemAdjustment(itemId, adjustmentId, amount) {
    setItems(current => current.map(item => item.id !== itemId ? item : {
      ...item,
      adjustments: (item.adjustments || []).map(adjustment => adjustment.id !== adjustmentId ? adjustment : { ...adjustment, amount }),
    }));
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
      if (!extracted.isReceipt) {
        setScanModal({
          title: 'ไม่สามารถอ่านใบเสร็จได้',
          message: 'รูปที่อัปโหลดอาจไม่ใช่ใบเสร็จ หรือรายละเอียดไม่ชัดเจน กรุณาอัปโหลดภาพใบเสร็จที่เห็นรายการและยอดชำระครบถ้วนอีกครั้ง',
        });
        return;
      }
      const extractedItems = extracted.items.map(item => ({
        ...item,
        price: String(item.price),
        addons: item.addons || [],
        adjustments: (item.adjustments || []).map(adjustment => ({ ...adjustment, id: makeId() })),
      }));
      setItems(extractedItems);
      const extractedCharges = extracted.charges.map(charge => ({ ...charge, id: makeId(), amount: Number(charge.amount) }));
      const extractedItemsGross = extractedItems.reduce((sum, item) => sum + itemGrossCents(item), 0);
      const extractedItemsNet = extractedItems.reduce((sum, item) => sum + itemNetCents(item), 0);
      const extractedChargesTotal = extractedCharges.reduce((sum, charge) => sum + cents(charge.amount), 0);
      const reportedSubtotal = cents(extracted.subtotal);
      const reportedTotal = cents(extracted.receiptTotal);
      const subtotalMatches = reportedSubtotal === 0
        || Math.abs(reportedSubtotal - extractedItemsGross) <= 1
        || Math.abs(reportedSubtotal - extractedItemsNet) <= 1;
      if (subtotalMatches && reportedTotal > 0) {
        const remaining = reportedTotal - extractedItemsNet - extractedChargesTotal;
        if (remaining !== 0) extractedCharges.push({
          id: makeId(),
          name: 'ส่วนต่างจากยอดสุทธิในใบเสร็จ',
          amount: remaining / 100,
        });
      }
      setCharges(extractedCharges);
      setReceiptSummary({ subtotal: extracted.subtotal, receiptTotal: extracted.receiptTotal });
    } catch {
      setScanModal({
        title: 'เกิดข้อผิดพลาด',
        message: 'ระบบเกิดข้อผิดพลาด กรุณาลองอัปโหลดรูปใบเสร็จอีกครั้ง',
      });
    }
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
    const result = { title, items: validItems.map(item => ({ ...item, assignedUserIds: item.assignedUserIds || [] })), charges, totalAmount, receiptImageUrl: receiptImage };
    const callback = onUpdateBill || onConfirmBill || onConfirm;
    try { await callback?.(result); }
    catch (cause) { setError(cause.message || 'บันทึกบิลไม่สำเร็จ'); }
  }

  return <main className="fixed inset-0 z-30 mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-white text-[#1A3048] shadow-2xl">
    <header className="relative z-10 flex h-[100px] shrink-0 items-center justify-between bg-[#8AE3FF] px-3">
      <button type="button" aria-label="Back" onClick={onBack || onClose} className="grid h-10 w-10 place-items-center text-[#00B8E6] hover:opacity-80"><ArrowLeft size={25}/></button>
      <h1 className="flex-1 pr-6 text-center text-xl font-bold">{title}</h1>
      <button type="button" aria-label="More options" className="grid h-10 w-8 place-items-center text-xl text-[#00B8E6]"><MoreHorizontal size={22}/></button>
    </header>

    <section className="relative h-[280px] shrink-0 bg-white">
      <div className="absolute inset-x-0 top-0 h-[149px] bg-[#8AE3FF]" />
      <button type="button" onClick={() => inputRef.current?.click()} className="absolute left-1/2 top-[25px] flex h-[228px] w-[205px] -translate-x-1/2 flex-col items-center justify-center overflow-hidden rounded-[22px] border border-gray-100 bg-white shadow-md">
        {receiptImage ? <img src={receiptImage} alt="Uploaded receipt" className="h-full w-full rounded-[22px] object-cover"/> : <><Camera size={39} strokeWidth={1.5} className="mb-1 text-[#7896A0]"/><span className="text-sm font-medium text-[#7896A0]">เพิ่มรูป</span></>}
        <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; loadImage(file); }}/>
      </button>
      <button type="button" aria-label="Upload or rescan receipt" onClick={() => inputRef.current?.click()} className="absolute left-[calc(50%+143px)] top-[182px] grid h-9 w-9 place-items-center rounded-full bg-[#00B8E6] text-white shadow-sm hover:bg-[#00A3CC]"><RotateCcw size={20}/></button>
      {scanning && <span className="absolute left-1/2 top-[267px] z-10 -translate-x-1/2 rounded-full bg-white/95 px-2 py-1 text-[10px] text-[#56838C]"><LoaderCircle size={12} className="mr-1 inline animate-spin"/>กำลังอ่านใบเสร็จ</span>}
    </section>

    <section className="flex min-h-0 flex-1 flex-col overflow-hidden px-[29px] pb-3">
      <div className="flex h-[43px] shrink-0 items-center justify-between border-b border-gray-200">
        <h2 className="text-base font-bold text-gray-800">รายการ</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-5">
        {items.map(item => <div key={item.id} className="my-3">
          <div className="flex items-center gap-3">
            <input aria-label="ชื่อรายการ" value={item.name} onChange={event => updateItem(item.id, 'name', event.target.value)} placeholder="" maxLength={80} className="min-w-0 flex-1 border-b border-gray-400 bg-transparent py-0 text-sm leading-4 text-gray-800 outline-none transition-colors focus:border-[#00B8E6] placeholder:text-gray-300"/>
            <input aria-label="ราคา" type="number" min="0" max="1000000" step="0.01" value={item.price} onChange={event => updateItem(item.id, 'price', event.target.value)} placeholder="" className="w-[67px] border-b border-gray-400 bg-transparent py-0 text-right text-sm font-semibold leading-4 text-gray-800 outline-none transition-colors focus:border-[#00B8E6] placeholder:text-gray-300"/>
            <button type="button" aria-label="ลบรายการ" onClick={() => removeItem(item.id)} className="ml-1 text-sm text-gray-400 hover:text-red-500"><X size={16}/></button>
          </div>
          {item.addons?.length > 0 && <div className="ml-2 mt-1 border-l-2 border-[#D9EEF2] pl-3 text-xs leading-relaxed text-gray-500">{item.addons.map((addon, index) => <p key={`${item.id}-addon-${index}`}>– {addon}</p>)}</div>}
          {item.adjustments?.map(adjustment => { const isDiscount = adjustment.name === 'ส่วนลด'; const isNegative = isDiscount || Number(adjustment.amount) < 0; return <label key={adjustment.id} className="ml-2 mt-1 flex items-center justify-between gap-3 border-l-2 border-rose-100 pl-3 text-xs text-rose-600"><span>{adjustment.name}</span><span className="flex items-center gap-1">{isNegative ? '−' : '+'}<input aria-label={`${adjustment.name} สำหรับ ${item.name}`} type="number" min={isNegative ? '0' : undefined} step="0.01" value={isNegative ? Math.abs(Number(adjustment.amount) || 0) : adjustment.amount} onChange={event => updateItemAdjustment(item.id, adjustment.id, isNegative ? -Math.abs(Number(event.target.value) || 0) : event.target.value)} className="w-20 border-b border-rose-200 bg-transparent text-right font-semibold outline-none focus:border-rose-500"/></span></label>; })}
        </div>)}
        <button type="button" onClick={addItem} className="mt-2 inline-flex items-center text-sm font-semibold text-[#00B8E6] underline">+ เพิ่มรายการ</button>
      </div>
      {error && <p role="alert" className="shrink-0 py-2 text-xs text-red-500">{error}</p>}
      <div className="shrink-0 border-y border-gray-200 py-3">
        {charges.map(charge => { const isDiscount = charge.name === 'ส่วนลด'; return <label key={charge.id || `${charge.name}-${charge.amount}`} className="flex items-center justify-between gap-3 py-1 text-sm text-gray-600"><span className="min-w-0 flex-1 truncate">{charge.name}</span><input aria-label={`ยอด ${charge.name}`} type="number" min={isDiscount ? '0' : undefined} step="0.01" value={isDiscount ? Math.abs(Number(charge.amount) || 0) : charge.amount} onChange={event => updateCharge(charge.id, isDiscount ? -Math.abs(Number(event.target.value) || 0) : event.target.value)} className="w-24 border-b border-gray-300 bg-transparent text-right font-semibold text-gray-800 outline-none focus:border-[#00B8E6]"/></label>; })}
        {subtotalMismatch && <p role="status" className="py-2 text-xs leading-relaxed text-amber-700">subtotal บนใบเสร็จไม่ตรงกับยอดรายการที่ AI อ่านได้ กรุณาตรวจชื่อหรือราคาของรายการ</p>}
        {!subtotalMismatch && totalMismatch && <p role="status" className="py-2 text-xs leading-relaxed text-amber-700">ยอดรวมยังไม่ตรงกับใบเสร็จ กรุณาตรวจค่าธรรมเนียมที่อ่านได้</p>}
        <div className="flex items-center justify-between pt-1">
        <span className="text-base font-bold text-gray-800">ยอดรวม</span><strong className="text-xl font-bold text-gray-900">{totalAmount.toFixed(2)}</strong>
        </div>
      </div>
    </section>

    <footer className="flex h-[86px] shrink-0 items-start justify-center bg-white pt-4">
      <button type="button" disabled={busy || scanning} onClick={confirm} className="h-[34px] w-auto min-w-[124px] rounded-full bg-[#00B8E6] px-4 text-sm font-bold text-white transition-colors hover:bg-[#00A3CC] disabled:opacity-60">{initialBill ? 'บันทึกการแก้ไข' : 'ยืนยัน'}</button>
    </footer>

    {scanModal && <div className="fixed inset-0 z-50 mx-auto grid w-full max-w-md place-items-center bg-slate-900/50 p-5"><section role="alertdialog" aria-modal="true" aria-labelledby="receipt-error-title" className="w-full rounded-2xl bg-white p-5 text-center shadow-xl"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-500"><AlertCircle size={25}/></span><h2 id="receipt-error-title" className="mt-3 text-lg font-bold text-[#1A3048]">{scanModal.title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{scanModal.message}</p><div className="mt-5 flex gap-2"><button type="button" onClick={() => setScanModal(null)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-slate-600">ปิด</button><button type="button" onClick={() => { setScanModal(null); inputRef.current?.click(); }} className="flex-1 rounded-xl bg-[#00B8E6] py-2.5 text-sm font-bold text-white">อัปโหลดรูปใหม่</button></div></section></div>}
  </main>;
}

