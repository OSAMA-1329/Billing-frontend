// import { formatCurrency, formatDate } from '../utils/format';

// interface LineItem {
//   productCode?: string;
//   productName: string;
//   quantity: number;
//   unit?: string;
//   priceUnit?: string;
//   price?: number;
//   purchaseRate?: number;
//   total: number;
// }

// interface InvoicePrintProps {
//   type: 'SALE' | 'PURCHASE';
//   invoiceNumber: string;
//   partyName: string;
//   date: string | Date;
//   items: LineItem[];
//   subtotal: number;
//   discount?: number;
//   gst?: number;
//   roundOff?: number;
//   grandTotal: number;
//   paymentMethod?: string;
//   thermal?: boolean;
// }

// export function InvoicePrint({
//   type,
//   invoiceNumber,
//   partyName,
//   date,
//   items,
//   subtotal,
//   discount = 0,
//   gst = 0,
//   roundOff = 0,
//   grandTotal,
//   paymentMethod,
//   thermal,
// }: InvoicePrintProps) {
//   return (
//     <div className={`print-only bg-white p-4 text-black ${thermal ? 'w-[80mm] text-xs' : 'w-full max-w-3xl'}`}>
//       <h1 className="text-center text-lg font-bold">{type === 'SALE' ? 'Tax Invoice' : 'Purchase Invoice'}</h1>
//       <p className="text-center text-sm">AR Traders Shop</p>
//       <div className="mt-2 grid grid-cols-2 gap-1 text-sm">
//         <span>Invoice: {invoiceNumber}</span>
//         <span>Date: {formatDate(date)}</span>
//         <span className="col-span-2">{type === 'SALE' ? 'Customer' : 'Supplier'}: {partyName}</span>
//       </div>
//       <table className="mt-3 w-full border-collapse text-sm">
//         <thead>
//           <tr className="border-b border-black">
//             <th className="py-1 text-left">Item</th>
//             <th className="py-1 text-right">Qty</th>
//             <th className="py-1 text-right">Rate</th>
//             <th className="py-1 text-right">Total</th>
//           </tr>
//         </thead>
//         <tbody>
//           {items.map((item, idx) => (
//             <tr key={idx} className="border-b border-slate-300">
//               <td className="py-1">{item.productName}</td>
//               <td className="py-1 text-right">{item.quantity} {item.unit ?? ''}</td>
//               <td className="py-1 text-right">{formatCurrency(item.price ?? item.purchaseRate ?? 0)}{item.priceUnit ? ` / ${item.priceUnit}` : ''}</td>
//               <td className="py-1 text-right">{formatCurrency(item.total)}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <div className="mt-3 space-y-1 text-sm">
//         <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
//         {discount > 0 && <div className="flex justify-between"><span>Discount</span><span>{formatCurrency(discount)}</span></div>}
//         {gst > 0 && <div className="flex justify-between"><span>GST</span><span>{formatCurrency(gst)}</span></div>}
//         {roundOff !== 0 && <div className="flex justify-between"><span>Round Off</span><span>{formatCurrency(roundOff)}</span></div>}
//         <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatCurrency(grandTotal)}</span></div>
//         {paymentMethod && <div>Payment: {paymentMethod}</div>}
//       </div>
//       <p className="mt-4 text-center text-xs">Thank you for your business</p>
//     </div>
//   );
// }
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
  thermal = true,
}: InvoicePrintProps) {
  return (
    <>
      <div
        id="invoice-print"
        className={
          thermal
            ? 'print-only thermal-invoice'
            : 'print-only regular-invoice'
        }
      >
        {/* =====================================
            SHOP HEADER
        ====================================== */}

        <div className="thermal-header">
          <div className="shop-name">
            AR Traders
          </div>

          <div className="shop-address">
            23/11, Mount Road, Tenkasi - 627811.
          </div>

          <div className="shop-mobile">
            Mobile : 86681 70419 / 97918 45135
          </div>

          <div className="shop-category">
            Spices/Nuts/Dry Fruits/Imported chocolate
          </div>
        </div>

        {/* =====================================
            INVOICE TITLE + DATE
        ====================================== */}

        <div className="invoice-heading">
          <span className="invoice-type">
            {type === 'SALE' ? 'ESTIMATE' : 'PURCHASE'}
          </span>

          <span className="invoice-date">
            தேதி: {formatDate(date)}
          </span>
        </div>

        {/* =====================================
            CUSTOMER / PAYMENT
        ====================================== */}

        <div className="customer-box">
          <div className="customer-left">
            <strong>
              To : {partyName || 'CASH SALES'}
            </strong>
          </div>

          <div className="customer-right">
            <strong>
              {paymentMethod || 'CASH'}
            </strong>

            <div className="payment-label">
              பில் நம்
            </div>

            <div className="invoice-number">
              {invoiceNumber}
            </div>
          </div>
        </div>

        {/* =====================================
            ITEMS HEADER
        ====================================== */}

        <table className="thermal-items">
          <thead>
            <tr>
              <th>விலை பொருள்</th>
              <th>அளவு</th>
              <th>மொத்தம்</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => {
              const rate =
                item.price ??
                item.purchaseRate ??
                0;

              return (
                <tr key={`${item.productCode ?? item.productName}-${index}`}>
                  <td className="product-cell">
                    <div className="product-name">
                      {item.productName}
                    </div>

                    {rate > 0 && (
                      <div className="product-rate">
                        {formatCurrency(rate)}
                        {item.priceUnit
                          ? ` / ${item.priceUnit}`
                          : ''}
                      </div>
                    )}
                  </td>

                  <td className="quantity-cell">
                    {item.quantity.toFixed(
                      Number.isInteger(item.quantity)
                        ? 0
                        : 3
                    )}

                    {item.unit && (
                      <span className="unit">
                        {item.unit}
                      </span>
                    )}
                  </td>

                  <td className="amount-cell">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* =====================================
            SUBTOTAL / DISCOUNT / GST
        ====================================== */}

        <div className="summary-box">
          <div className="summary-row">
            <span>பில் தொகை :</span>

            <strong>
              {formatCurrency(subtotal)}
            </strong>
          </div>

          {discount > 0 && (
            <div className="summary-row">
              <span>Discount :</span>

              <strong>
                {formatCurrency(discount)}
              </strong>
            </div>
          )}

          {gst > 0 && (
            <div className="summary-row">
              <span>GST :</span>

              <strong>
                {formatCurrency(gst)}
              </strong>
            </div>
          )}

          {roundOff !== 0 && (
            <div className="summary-row">
              <span>Round Off :</span>

              <strong>
                {formatCurrency(roundOff)}
              </strong>
            </div>
          )}
        </div>

        {/* =====================================
            GRAND TOTAL
        ====================================== */}

        <div className="grand-total-box">
          <div className="summary-row grand-total-row">
            <span>
              E.& O.E. மொத்த தொகை :
            </span>

            <strong>
              {formatCurrency(grandTotal)}
            </strong>
          </div>
        </div>

        {/* =====================================
            FOOTER
        ====================================== */}

        <div className="thermal-footer">
          நன்றி! மீண்டும் வருக!
        </div>
      </div>

      {/* =====================================
          THERMAL PRINT CSS
      ====================================== */}

      <style >{`
        /* =====================================
           NORMAL THERMAL RECEIPT
        ====================================== */

        .thermal-invoice {
          width: 80mm;
          max-width: 80mm;

          height: auto;
          min-height: 0;

          margin: 0 auto;
          padding: 3mm 4mm;

          box-sizing: border-box;

          background: #ffffff;
          color: #000000;

          font-family:
            Arial,
            "Noto Sans Tamil",
            sans-serif;

          font-size: 10px;

          line-height: 1.25;

          overflow: visible;
        }

        /* =====================================
           HEADER
        ====================================== */

        .thermal-header {
          width: 100%;

          border: 1px solid #555;

          border-radius: 5px;

          box-sizing: border-box;

          text-align: center;

          overflow: hidden;
        }

        .shop-name {
          padding-top: 3px;

          font-size: 20px;

          line-height: 22px;

          font-weight: 800;
        }

        .shop-address {
          padding: 2px 3px 0;

          font-size: 10px;

          line-height: 13px;
        }

        .shop-mobile {
          padding: 1px 3px 3px;

          font-size: 9px;

          line-height: 12px;
        }

        .shop-category {
          padding: 3px 2px;

          border-top: 1px solid #555;

          font-size: 9px;

          line-height: 12px;
        }

        /* =====================================
           INVOICE HEADING
        ====================================== */

        .invoice-heading {
          display: flex;

          align-items: center;

          gap: 4px;

          margin-top: 5px;

          min-height: 18px;
        }

        .invoice-type {
          display: inline-block;

          padding: 1px 3px;

          background: #555;

          color: #fff;

          font-size: 10px;

          line-height: 14px;

          font-weight: 800;
        }

        .invoice-date {
          font-size: 9px;

          white-space: nowrap;
        }

        /* =====================================
           CUSTOMER BOX
        ====================================== */

        .customer-box {
          display: grid;

          grid-template-columns: 1fr 32%;

          margin-top: 3px;

          border: 1px solid #555;

          box-sizing: border-box;

          min-height: 43px;
        }

        .customer-left {
          padding: 5px 4px;

          font-size: 11px;

          line-height: 15px;

          word-break: break-word;
        }

        .customer-right {
          padding: 4px;

          border-left: 1px solid #555;

          text-align: left;

          font-size: 10px;

          line-height: 14px;
        }

        .payment-label {
          margin-top: 1px;

          font-size: 9px;
        }

        .invoice-number {
          font-size: 11px;

          font-weight: 700;
        }

        /* =====================================
           PRODUCTS TABLE
        ====================================== */

        .thermal-items {
          width: 100%;

          margin-top: 0;

          border-collapse: collapse;

          table-layout: fixed;

          font-size: 9px;
        }

        .thermal-items thead tr {
          border-left: 1px solid #555;

          border-right: 1px solid #555;

          border-bottom: 1px solid #555;
        }

        .thermal-items th {
          padding: 4px 2px;

          font-weight: 700;

          text-align: center;

          border-right: 1px solid #555;
        }

        .thermal-items th:last-child {
          border-right: 0;
        }

        .thermal-items tbody tr {
          break-inside: avoid;

          page-break-inside: avoid;
        }

        .thermal-items td {
          padding: 3px 2px;

          vertical-align: top;

          border-bottom: 0;
        }

        /* Product */

        .thermal-items th:nth-child(1),
        .thermal-items td:nth-child(1) {
          width: 53%;

          text-align: left;
        }

        /* Quantity */

        .thermal-items th:nth-child(2),
        .thermal-items td:nth-child(2) {
          width: 19%;

          text-align: right;

          white-space: nowrap;
        }

        /* Amount */

        .thermal-items th:nth-child(3),
        .thermal-items td:nth-child(3) {
          width: 28%;

          text-align: right;

          white-space: nowrap;
        }

        .product-name {
          font-weight: 500;

          word-break: break-word;

          overflow-wrap: anywhere;
        }

        .product-rate {
          font-size: 8px;

          line-height: 10px;

          color: #333;
        }

        .quantity-cell {
          white-space: nowrap;
        }

        .quantity-cell .unit {
          margin-left: 2px;
        }

        .amount-cell {
          font-weight: 500;
        }

        /* =====================================
           SUMMARY
        ====================================== */

        .summary-box {
          margin-top: 4px;

          border: 1px solid #555;

          box-sizing: border-box;
        }

        .summary-row {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 5px;

          padding: 4px;

          font-size: 10px;

          line-height: 14px;
        }

        .summary-row strong {
          font-size: 12px;

          white-space: nowrap;
        }

        /* =====================================
           GRAND TOTAL
        ====================================== */

        .grand-total-box {
          border: 1px solid #555;

          border-top: 0;

          box-sizing: border-box;
        }

        .grand-total-row {
          min-height: 34px;

          font-size: 10px;

          font-weight: 700;
        }

        .grand-total-row strong {
          font-size: 13px;
        }

        /* =====================================
           FOOTER
        ====================================== */

        .thermal-footer {
          margin-top: 7px;

          padding-bottom: 2px;

          text-align: center;

          font-size: 13px;

          line-height: 18px;

          font-weight: 500;
        }

        /* =====================================
           REGULAR INVOICE
        ====================================== */

        .regular-invoice {
          width: 100%;

          max-width: 768px;

          margin: 0 auto;

          padding: 16px;

          box-sizing: border-box;

          background: #fff;

          color: #000;
        }

        /* =====================================
           PRINT SETTINGS
        ====================================== */

        @media print {
          @page {
            size: 80mm auto;

            margin: 0;
          }

          html,
          body {
            width: 80mm;

            margin: 0 !important;

            padding: 0 !important;

            background: #fff;
          }

          body {
            -webkit-print-color-adjust: exact;

            print-color-adjust: exact;
          }

          body * {
            visibility: hidden;
          }

          .print-only,
          .print-only * {
            visibility: visible;
          }

          .thermal-invoice {
            display: block;

            width: 80mm;

            max-width: 80mm;

            height: auto;

            min-height: 0;

            margin: 0;

            padding: 3mm 4mm;

            box-sizing: border-box;

            overflow: visible;

            break-after: auto;

            page-break-after: auto;
          }

          .thermal-items tr {
            break-inside: avoid;

            page-break-inside: avoid;
          }

          .thermal-header,
          .customer-box,
          .summary-box,
          .grand-total-box {
            break-inside: avoid;

            page-break-inside: avoid;
          }

          .thermal-footer {
            break-inside: avoid;

            page-break-inside: avoid;
          }

          .regular-invoice {
            width: 100%;

            max-width: none;

            padding: 16px;
          }
        }
      `}</style>
    </>
  );
}