import { GoogleGenAI } from '@google/genai';

const receiptSchema = {
  type: 'object',
  properties: {
    isReceipt: { type: 'boolean' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'number' },
        },
        required: ['name', 'price'],
        additionalProperties: false,
      },
    },
    charges: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          amount: { type: 'number' },
        },
        required: ['name', 'amount'],
        additionalProperties: false,
      },
    },
    subtotal: { type: 'number' },
    receiptTotal: { type: 'number' },
  },
  required: ['isReceipt', 'items', 'charges', 'subtotal', 'receiptTotal'],
  additionalProperties: false,
};

const imageDataPattern = /^data:(image\/(?:png|jpeg|webp|gif|heic|heif|avif));base64,([A-Za-z0-9+/]+={0,2})$/i;

export async function analyzeReceipt(request, response) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return response.status(503).json({ error: { message: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Backend/.env' } });
  }

  const match = imageDataPattern.exec(request.body?.image ?? '');
  if (!match) {
    return response.status(400).json({ error: { message: 'รูปภาพใบเสร็จไม่ถูกต้องหรือไม่รองรับ' } });
  }

  const [, mimeType, imageData] = match;
  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 20000, retryOptions: { attempts: 1 } } });
    const contents = [{
      role: 'user',
      parts: [
        {
          text: 'ตรวจภาพก่อนว่าเป็นใบเสร็จ/บิลที่มีรายการและราคาอ่านได้หรือไม่. ตั้ง isReceipt เป็น true เฉพาะเมื่อเห็นรูปแบบใบเสร็จและอ่านรายการสินค้า/อาหารพร้อมราคาได้อย่างน้อยหนึ่งรายการ; ถ้าไม่ใช่ใบเสร็จ ภาพเบลอ/มืด/ถูกบัง หรืออ่านรูปแบบและรายการไม่ได้ ให้ isReceipt เป็น false และส่ง items กับ charges เป็น array ว่าง. สำหรับภาพที่เป็นใบเสร็จให้อ่านทั้งรายการและส่วนสรุปท้ายใบเสร็จ ห้ามหยุดเมื่อพบ subtotal. items คือสินค้า/อาหารแต่ละบรรทัด โดย price เป็นราคารวมของบรรทัดนั้น (รวมจำนวนชิ้นของบรรทัดแล้ว) ไม่ใช่ราคาต่อชิ้น. charges คือรายการปรับยอดทุกชนิดที่แสดงแยกจากสินค้า เช่น service charge, VAT/TAX, rounding/round off, discount, delivery, surcharge; เก็บชื่อเดิมและจำนวนเงินจริงตามใบเสร็จ ส่วนลดหรือ rounding ที่ลดราคาให้ใช้ amount ติดลบ. ถ้ามีเปอร์เซ็นต์ ให้คำนวณจำนวนเงินจากฐานที่ระบุในใบเสร็จ; ถ้ามีจำนวนเงินจริงให้ใช้จำนวนนั้น. subtotal คือยอดก่อน charges ตามที่พิมพ์ไว้; receiptTotal คือยอดสุทธิที่ต้องจ่าย. ห้ามนำ subtotal, before tax, ยอดรวม หรือยอดชำระมาเป็นสินค้า และห้ามนับค่าเดียวกันซ้ำ. หาก subtotal หรือ receiptTotal อ่านไม่ได้ให้ใส่ 0; หากไม่พบ charges ให้ส่ง array ว่าง. คงภาษาเดิมและอย่าเดารายการอาหารหรือราคา',
        },
        { inlineData: { mimeType: mimeType.toLowerCase(), data: imageData } },
      ],
    }];
    const config = {
      responseMimeType: 'application/json',
      responseJsonSchema: receiptSchema,
    };
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.6-flash';
    const models = [...new Set([primaryModel, fallbackModel])];
    let result;
    let lastError;

    for (const model of models) {
      try {
        result = await ai.models.generateContent({ model, contents, config });
        break;
      } catch (error) {
        lastError = error;
        const status = Number(error?.status);
        if (status !== 429 && status < 500) throw error;
      }
    }

    if (!result) throw lastError || new Error('Gemini did not return a result');
    const parsed = JSON.parse(result.text || '{}');
    const items = (Array.isArray(parsed.items) ? parsed.items : [])
      .map(item => ({ name: String(item?.name ?? '').trim(), price: Number(item?.price) }))
      .filter(item => item.name && Number.isFinite(item.price) && item.price >= 0 && item.price <= 1000000);
    const charges = (Array.isArray(parsed.charges) ? parsed.charges : [])
      .map(charge => ({ name: String(charge?.name ?? '').trim(), amount: Number(charge?.amount) }))
      .filter(charge => charge.name && Number.isFinite(charge.amount) && charge.amount >= -1000000 && charge.amount <= 1000000);
    const subtotal = Number(parsed.subtotal);
    const receiptTotal = Number(parsed.receiptTotal);

    return response.json({
      isReceipt: parsed.isReceipt === true && items.length > 0,
      items,
      charges,
      subtotal: Number.isFinite(subtotal) && subtotal > 0 && subtotal <= 1000000 ? subtotal : 0,
      receiptTotal: Number.isFinite(receiptTotal) && receiptTotal > 0 && receiptTotal <= 1000000 ? receiptTotal : 0,
    });
  } catch (error) {
    const status = Number(error?.status);
    console.error('Gemini receipt analysis failed; provider status:', status || 'unknown');
    if (status === 429 || status === 503) {
      return response.status(503).json({ error: { message: 'Gemini มีผู้ใช้งานจำนวนมากชั่วคราว กรุณาลองอีกครั้ง' } });
    }
    if (status === 401 || status === 403) {
      return response.status(503).json({ error: { message: 'กรุณาตรวจสอบ GEMINI_API_KEY ใน Backend/.env' } });
    }
    return response.status(502).json({ error: { message: 'Gemini อ่านใบเสร็จไม่สำเร็จ กรุณาลองอีกครั้ง' } });
  }
}


