import { GoogleGenAI } from '@google/genai';

const receiptSchema = {
  type: 'object',
  properties: {
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
  },
  required: ['items'],
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
          text: 'อ่านใบเสร็จจากรูปนี้ แล้วดึงเฉพาะรายการสินค้าหรืออาหารแต่ละบรรทัดพร้อมราคาของรายการนั้น คงชื่อสินค้าเป็นภาษาเดิม ไม่นำยอดรวม ภาษี ค่าบริการ ส่วนลด หรือยอดชำระมาเป็นรายการ อย่าเดาข้อความหรือราคาที่อ่านไม่ชัด ให้ละรายการนั้นไป หากไม่พบรายการที่อ่านได้ ให้ส่ง items เป็น array ว่าง',
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

    return response.json({ items });
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


