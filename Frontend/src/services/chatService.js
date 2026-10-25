const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const sanitize=value=>String(value??'').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,500);
export const chatService={async sendMessage(content){await delay(220);const safe=sanitize(content);if(!safe)throw new Error('พิมพ์ข้อความก่อนส่ง');return{id:crypto.randomUUID(),content:safe,timestamp:new Date().toISOString()}}};
