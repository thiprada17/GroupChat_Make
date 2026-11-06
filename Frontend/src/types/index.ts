export interface User { id: string; name: string; avatarColor: string }
export interface BillItem { id: string; name: string; price: number; addons?: string[]; adjustments?: { name: string; amount: number }[]; assignedUserIds: string[] }
export type SessionStatus = 'idle' | 'open' | 'closed';
export interface BillSession { id: string; title: string; date: string; receiptImageUrl?: string; items: BillItem[]; status: SessionStatus; createdById: string; memberSummaries: { userId: string; totalAmount: number; isPaid: boolean }[] }
export interface CollectionDetails { items: { name: string; addons?: string[]; grossAmount: number; adjustments: { name: string; amount: number }[]; amount: number }[]; itemsAmount: number; charges: { name: string; amount: number }[]; total: number }
export interface ChatMessage { id: string; senderId: string; type: 'text' | 'bill_session' | 'payment_receipt' | 'system_divider' | 'system_status' | 'collection'; content?: string; recipientId?: string; amount?: number; isPaid?: boolean; details?: CollectionDetails; billSession?: BillSession; paymentDetails?: { amount: number; recipientId: string }; timestamp: string }
