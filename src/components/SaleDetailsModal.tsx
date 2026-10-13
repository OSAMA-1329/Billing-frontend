import { useQuery } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { apiGet, apiErrorMessage } from '../api/client';
import { InvoicePrint } from './InvoicePrint';
import { Modal } from './Modal';
import { formatCurrency } from '../utils/format';

interface SaleItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit?: string;
  priceUnit?: string;
  price: number;
  discount: number;
  gst: number;
  total: number;
}

export interface SaleDetails {
  _id: string;
  invoiceNumber: string;
  createdAt: string;
  customerName: string;
  customerId?: string | { _id: string; name: string; phone?: string; address?: string; gstNumber?: string } | null;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  gst: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: string;
  createdBy?: { name?: string; email?: string; role?: string } | null;
}

interface SaleDetailsModalProps {
  invoiceId: string;
  onClose: () => void;
  onRebill: (invoice: SaleDetails) => void;
}

function displayDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString('en-IN');
}

export function SaleDetailsModal({ invoiceId, onClose, onRebill }: SaleDetailsModalProps) {
  const invoiceQuery = useQuery({
    queryKey: ['sale-details', invoiceId],
    queryFn: () => apiGet<SaleDetails>(`/sales/${encodeURIComponent(invoiceId)}`),
    enabled: Boolean(invoiceId),
  });
  const invoice = invoiceQuery.data;
  const customer = typeof invoice?.customerId === 'object' && invoice.customerId ? invoice.customerId : undefined;

  return (
    <Modal open={Boolean(invoiceId)} title={invoice ? `Bill ${invoice.invoiceNumber}` : 'Bill details'} onClose={onClose} wide>
      {invoiceQuery.isPending ? <p className="empty-state">Loading bill details...</p> : null}
      {invoiceQuery.isError ? (
        <div className="empty-state">
          <p>{apiErrorMessage(invoiceQuery.error, 'Bill details could not be loaded.')}</p>
          <button type="button" className="btn-secondary mt-3" onClick={() => invoiceQuery.refetch()}>Retry</button>
        </div>
      ) : null}
      {invoice ? (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div><span className="label">Bill ID</span><p className="break-all font-mono text-sm">{invoice._id}</p></div>
            <div><span className="label">Date and time</span><p className="text-sm">{displayDateTime(invoice.createdAt)}</p></div>
            <div><span className="label">Customer</span><p className="text-sm">{invoice.customerName || customer?.name || 'Walk-in Customer'}</p></div>
            <div><span className="label">Phone</span><p className="text-sm">{customer?.phone || '—'}</p></div>
            <div><span className="label">Address / GST</span><p className="text-sm">{[customer?.address, customer?.gstNumber].filter(Boolean).join(' · ') || '—'}</p></div>
            <div><span className="label">Cashier</span><p className="text-sm">{invoice.createdBy?.name || invoice.createdBy?.email || '—'}</p></div>
          </div>

          <div className="table-scroll mb-4">
            <table className="table-dense w-full min-w-[760px]">
              <thead><tr><th>Product / SKU</th><th>Quantity</th><th className="text-right">Unit price</th><th className="text-right">Discount</th><th className="text-right">Tax</th><th className="text-right">Line total</th></tr></thead>
              <tbody>{invoice.items.map((item, index) => (
                <tr key={`${item.productId}-${index}`}>
                  <td><strong>{item.productName}</strong><span className="block text-xs text-slate-500">{item.productCode}</span></td>
                  <td>{item.quantity.toLocaleString('en-IN', { maximumFractionDigits: 3 })} {item.unit || ''}</td>
                  <td className="text-right tabular-nums">{formatCurrency(item.price)}{item.priceUnit ? ` / ${item.priceUnit}` : ''}</td>
                  <td className="text-right tabular-nums">{formatCurrency(item.discount || 0)}</td>
                  <td className="text-right tabular-nums">{formatCurrency(item.gst || 0)}</td>
                  <td className="text-right tabular-nums">{formatCurrency(item.total)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt>Subtotal</dt><dd className="text-right tabular-nums">{formatCurrency(invoice.subtotal)}</dd>
              <dt>Overall discount</dt><dd className="text-right tabular-nums">{formatCurrency(invoice.discount)}</dd>
              <dt>Tax / GST</dt><dd className="text-right tabular-nums">{formatCurrency(invoice.gst)}</dd>
              <dt>Round off</dt><dd className="text-right tabular-nums">{formatCurrency(invoice.roundOff)}</dd>
              <dt className="font-semibold">Grand total</dt><dd className="text-right font-semibold tabular-nums">{formatCurrency(invoice.grandTotal)}</dd>
            </dl>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt>Payment method</dt><dd className="text-right">{invoice.paymentMethod}</dd>
              <dt>Payment status</dt><dd className="text-right">{invoice.balanceAmount > 0 ? 'Partially paid / due' : 'Paid'}</dd>
              <dt>Amount paid</dt><dd className="text-right tabular-nums">{formatCurrency(invoice.paidAmount)}</dd>
              <dt>Balance due</dt><dd className="text-right tabular-nums">{formatCurrency(invoice.balanceAmount)}</dd>
              <dt>Change returned</dt><dd className="text-right tabular-nums">{formatCurrency(Math.max(0, invoice.paidAmount - invoice.grandTotal))}</dd>
            </dl>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" className="btn-secondary" onClick={() => window.print()}>Reprint bill</button>
            <button type="button" className="btn-primary" onClick={() => onRebill(invoice)}>Rebill</button>
          </div>
          {createPortal(
            <InvoicePrint
              type="SALE"
              invoiceNumber={invoice.invoiceNumber}
              partyName={invoice.customerName}
              date={invoice.createdAt}
              items={invoice.items}
              subtotal={invoice.subtotal}
              discount={invoice.discount}
              gst={invoice.gst}
              roundOff={invoice.roundOff}
              grandTotal={invoice.grandTotal}
              paymentMethod={invoice.paymentMethod}
              thermal
            />,
            document.body
          )}
        </>
      ) : null}
    </Modal>
  );
}