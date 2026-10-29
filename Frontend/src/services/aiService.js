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
    throw new Error(result?.error?.message || 'Gemini อ่านใบเสร็จไม่สำเร็จ กรุณาลองอีกครั้ง');
  }
  if (!Array.isArray(result?.items)) {
    throw new Error('ไม่พบรายการสินค้าในผลการอ่านใบเสร็จ');
  }

  const items = result.items
    .map(item => ({ name: String(item?.name ?? '').trim(), price: Number(item?.price) }))
    .filter(item => item.name && Number.isFinite(item.price) && item.price >= 0 && item.price <= 1000000)
    .map(item => ({ ...item, id: crypto.randomUUID() }));

  if (!items.length) throw new Error('ไม่พบรายการสินค้าในใบเสร็จ กรุณากรอกเอง');
  return items;
}
