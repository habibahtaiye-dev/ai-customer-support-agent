import type { KnowledgeDocument } from './types';

/**
 * A small, self-contained knowledge base used by the demo so the agent can
 * answer questions immediately without any external API or login.
 *
 * The content is intentionally fictional (for a fictional company called
 * "Northwind Home") but structured exactly the way a real knowledge base
 * would be: each document has a category, tags, and body content.
 */
export const KNOWLEDGE_BASE: KnowledgeDocument[] = [
  {
    id: 'kb-001',
    title: 'Order Status & Tracking',
    category: 'Orders',
    tags: ['order', 'tracking', 'delivery', 'shipping', 'status'],
    content: `Customers can track their order status from the "My Orders" page after signing in. Once an order ships, a tracking link is emailed within 24 hours and is also visible on the order detail page. Orders are typically processed within 1 business day. Standard shipping takes 3-5 business days; express shipping takes 1-2 business days. If a tracking link has not appeared within 48 hours of payment, customers should contact support.`,
  },
  {
    id: 'kb-002',
    title: 'Return Policy',
    category: 'Returns',
    tags: ['return', 'refund', 'policy', 'exchange', 'money back'],
    content: `Northwind Home accepts returns within 30 days of delivery for unused items in their original packaging. To start a return, go to "My Orders", select the order, and click "Request Return". A prepaid return label will be emailed within 1 business day. Refunds are issued to the original payment method within 5-7 business days after the returned item is received and inspected. Final-sale and personalized items are not eligible for returns.`,
  },
  {
    id: 'kb-003',
    title: 'Payment Methods',
    category: 'Billing',
    tags: ['payment', 'credit card', 'debit', 'paypal', 'apple pay', 'billing'],
    content: `We accept Visa, Mastercard, American Express, Discover, PayPal, Apple Pay, and Google Pay. All payments are processed securely and we never store full card numbers. For subscription orders, the saved payment method is charged automatically on each renewal date. If a payment fails, a retry is attempted after 3 days and a notification email is sent.`,
  },
  {
    id: 'kb-004',
    title: 'Account & Password Help',
    category: 'Account',
    tags: ['account', 'password', 'login', 'sign in', 'reset', 'locked'],
    content: `To reset a forgotten password, click "Forgot password" on the sign-in page and enter the account email. A reset link is sent that is valid for 30 minutes. If an account is locked after too many failed sign-in attempts, it automatically unlocks after 15 minutes. Customers should never share their password with anyone, including support agents.`,
  },
  {
    id: 'kb-005',
    title: 'Warranty Information',
    category: 'Warranty',
    tags: ['warranty', 'defect', 'repair', 'guarantee', 'broken'],
    content: `Northwind Home products include a 1-year limited warranty against manufacturing defects from the date of purchase. To file a warranty claim, provide the order number and a photo of the defect via the support contact form. Approved claims result in a free replacement or full refund. The warranty does not cover normal wear, accidental damage, or unauthorized modifications.`,
  },
  {
    id: 'kb-006',
    title: 'Contacting Support & Hours',
    category: 'Support',
    tags: ['contact', 'support', 'hours', 'phone', 'email', 'help'],
    content: `Support is available by live chat 24/7, by email at support@northwindhome.example, and by phone at 1-800-555-0142 Monday through Friday 8am-8pm ET. Average email response time is under 4 business hours. For order-specific questions, having the order number ready speeds up resolution.`,
  },
  {
    id: 'kb-007',
    title: 'Shipping Restrictions',
    category: 'Shipping',
    tags: ['shipping', 'international', 'destination', 'restriction', 'pobox'],
    content: `We currently ship to the United States and Canada. Some oversized items cannot be shipped to PO boxes or rural routes and require a street address. International orders may be subject to customs duties that are the responsibility of the recipient. A list of restricted destinations is shown at checkout based on the shipping address entered.`,
  },
  {
    id: 'kb-008',
    title: 'Cancelling or Modifying an Order',
    category: 'Orders',
    tags: ['cancel', 'modify', 'change', 'edit', 'order'],
    content: `Orders can be cancelled or edited within 30 minutes of placing them, before they enter processing. Go to "My Orders", open the order, and choose "Cancel" or "Edit Items". After the 30-minute window or once the order shows "Processing", changes are no longer possible and the customer must request a return after delivery instead.`,
  },
];

export function getKnowledgeBase(): KnowledgeDocument[] {
  return KNOWLEDGE_BASE;
}
