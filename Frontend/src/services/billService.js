const delay=ms=>new Promise(resolve=>setTimeout(resolve,350));
export const billService = {
  async saveBill(bill) {
    await delay(350);
    const title = String(bill.title ?? '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 60);
    const items = bill.items.map(item => {
      const name = String(item.name ?? '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 80);
      const price = Math.round(Number(item.price) * 100) / 100;
      if (!name || !Number.isFinite(price) || price < 0 || price > 1000000) throw new Error('กรุณาตรวจสอบชื่อและราคาของรายการ');
      const addons = (Array.isArray(item.addons) ? item.addons : [])
        .map(addon => String(addon ?? '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 80))
        .filter(Boolean)
        .slice(0, 12);
      const adjustments = (Array.isArray(item.adjustments) ? item.adjustments : []).map(adjustment => {
        const adjustmentName = String(adjustment.name ?? '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 60);
        const amount = Math.round(Number(adjustment.amount) * 100) / 100;
        if (!adjustmentName || !Number.isFinite(amount) || Math.abs(amount) > 1000000) throw new Error('กรุณาตรวจสอบส่วนลดหรือรายการปรับยอดของเมนู');
        return { name: adjustmentName, amount };
      });
      if (price + adjustments.reduce((sum, adjustment) => sum + adjustment.amount, 0) < 0) throw new Error('ยอดส่วนลดของเมนูต้องไม่มากกว่าราคาเมนู');
      return { ...item, name, price, addons, adjustments };
    });
    const charges = (bill.charges || []).map(charge => {
      const name = String(charge.name ?? '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 60);
      const amount = Math.round(Number(charge.amount) * 100) / 100;
      if (!name || !Number.isFinite(amount) || amount < -1000000 || amount > 1000000) throw new Error('กรุณาตรวจสอบ VAT ค่าบริการ หรือยอดปัดเศษ');
      return { name, amount };
    });
    if (!items.length) throw new Error('เพิ่มรายการอาหารอย่างน้อย 1 รายการ');
    return { ...bill, title, items, charges };
  },
  async closeSession(session) {
    await delay(500);
    if (!session.items.length) throw new Error('ไม่พบรายการในบิล');
    return { ...session, status: 'closed' };
  },
};
