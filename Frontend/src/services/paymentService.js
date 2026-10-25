const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export const paymentService={async transfer(amount){const safe=Math.round(Number(amount)*100)/100;if(!Number.isFinite(safe)||safe<0||safe>1000000)throw new Error('ยอดเงินไม่ถูกต้อง');await delay(500);return{amount:safe,reference:crypto.randomUUID(),status:'completed'}}};
