import { formatCurrency, formatDate } from '../utils/format';

interface LineItem {
  productCode?: string;
  productName: string;
  quantity: number;
  unit?: string;
  priceUnit?: string;
  price?: number;
  purchaseRate?: number;
  total: number;
}

interface InvoicePrintProps {
  type: 'SALE' | 'PURCHASE';
  invoiceNumber: string;
  partyName: string;
  date: string | Date;
  items: LineItem[];
  subtotal: number;
  discount?: number;
  gst?: number;
  roundOff?: number;
  grandTotal: number;
  paymentMethod?: string;
  thermal?: boolean;
}

export function InvoicePrint({
  type,
  invoiceNumber,
  partyName,
  date,
  items,
  subtotal,
  discount = 0,
  gst = 0,
  roundOff = 0,
  grandTotal,
  paymentMethod,
  thermal,
}: InvoicePrintProps) {
  return (
    <div className={`print-only bg-white p-4 text-black ${thermal ? 'w-[80mm] text-xs' : 'w-full max-w-3xl'}`}>
      <h1 className="text-center text-lg font-bold">{type === 'SALE' ? 'Tax Invoice' : 'Purchase Invoice'}</h1>
      <p className="text-center text-sm">AR Traders Shop</p>
      <div className="mt-2 grid grid-cols-2 gap-1 text-sm">
        <span>Invoice: {invoiceNumber}</span>
        <span>Date: {formatDate(date)}</span>
        <span className="col-span-2">{type === 'SALE' ? 'Customer' : 'Supplier'}: {partyName}</span>
      </div>
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black">
            <th className="py-1 text-left">Item</th>
            <th className="py-1 text-right">Qty</th>
            <th className="py-1 text-right">Rate</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-300">
              <td className="py-1">{item.productName}</td>
              <td className="py-1 text-right">{item.quantity} {item.unit ?? ''}</td>
              <td className="py-1 text-right">{formatCurrency(item.price ?? item.purchaseRate ?? 0)}{item.priceUnit ? ` / ${item.priceUnit}` : ''}</td>
              <td className="py-1 text-right">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        {discount > 0 && <div className="flex justify-between"><span>Discount</span><span>{formatCurrency(discount)}</span></div>}
        {gst > 0 && <div className="flex justify-between"><span>GST</span><span>{formatCurrency(gst)}</span></div>}
        {roundOff !== 0 && <div className="flex justify-between"><span>Round Off</span><span>{formatCurrency(roundOff)}</span></div>}
        <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatCurrency(grandTotal)}</span></div>
        {paymentMethod && <div>Payment: {paymentMethod}</div>}
      </div>
      <p className="mt-4 text-center text-xs">Thank you for your business</p>
    </div>
  );
}
