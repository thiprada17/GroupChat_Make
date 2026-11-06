export async function scanReceipt(imageDataUrl) {
  if (!imageDataUrl || typeof imageDataUrl !== 'string') {
    throw new Error('ไม่พบรูปใบเสร็จ กรุณาเลือกรูปอีกครั้ง');
  }

  let response;
  try {
    response = await fetch('/api/receipts/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageDataUrl }),
    });
  } catch {
    throw new Error('เชื่อมต่อบริการอ่านใบเสร็จไม่ได้ กรุณาตรวจสอบว่า backend กำลังทำงาน');
  }

  let result;
  try { result = await response.json(); }
  catch { throw new Error('ได้รับผลการอ่านใบเสร็จไม่ถูกต้อง'); }

  if (!response.ok) {
    throw new Error(result?.error?.message || 'ระบบเกิดข้อผิดพลาด กรุณาลองอัปโหลดรูปใบเสร็จอีกครั้ง');
  }
  if (!Array.isArray(result?.items)) {
    throw new Error('ไม่พบรายการสินค้าในผลการอ่านใบเสร็จ');
  }

  const items = result.items
    .map(item => ({
      name: String(item?.name ?? '').trim(),
      price: Number(item?.price),
      addons: (Array.isArray(item?.addons) ? item.addons : []).map(addon => String(addon ?? '').trim()).filter(Boolean),
    }))
    .filter(item => item.name && Number.isFinite(item.price) && item.price >= 0 && item.price <= 1000000)
    .map(item => ({ ...item, id: crypto.randomUUID() }));

  const charges = (Array.isArray(result?.charges) ? result.charges : [])
    .map(charge => ({ name: String(charge?.name ?? '').trim(), amount: Number(charge?.amount) }))
    .filter(charge => charge.name && Number.isFinite(charge.amount) && charge.amount >= -1000000 && charge.amount <= 1000000);

  return {
    isReceipt: result?.isReceipt === true && items.length > 0,
    items,
    charges,
    subtotal: Number(result?.subtotal) > 0 ? Number(result.subtotal) : 0,
    receiptTotal: Number(result?.receiptTotal) > 0 ? Number(result.receiptTotal) : 0,
  };
}
