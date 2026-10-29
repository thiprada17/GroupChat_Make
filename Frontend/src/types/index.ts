export interface User { id: string; name: string; avatarColor: string }
export interface BillItem { id: string; name: string; price: number; assignedUserIds: string[] }
export type SessionStatus = 'idle' | 'open' | 'closed';
export interface BillSession { id: string; title: string; date: string; receiptImageUrl?: string; items: BillItem[]; status: SessionStatus; createdById: string; memberSummaries: { userId: string; totalAmount: number; isPaid: boolean }[] }
export interface ChatMessage { id: string; senderId: string; type: 'text' | 'bill_session' | 'payment_receipt' | 'system_divider' | 'system_status'; content?: string; billSession?: BillSession; paymentDetails?: { amount: number; recipientId: string }; timestamp: string }
