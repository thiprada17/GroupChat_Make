const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function scanReceipt(){await delay(1100);return[{name:'ส้มตำ',price:65},{name:'หมูสามชั้นทอดน้ำปลา',price:110},{name:'ข้าวเหนียว',price:10}].map(item=>({...item,id:crypto.randomUUID()}))}
