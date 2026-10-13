
import { formatCurrency, formatDate } from "../utils/format";

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
  type: "SALE" | "PURCHASE";
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
  paymentMethod = "CASH",
  thermal = true,
}: InvoicePrintProps) {
  if (!items?.length) return null;

  return (
    <>
      <div
        id="invoice-print"
        className={thermal ? "thermal-invoice" : "regular-invoice"}
      >
        {/* SHOP HEADER */}
        <header className="thermal-header">
          <div className="shop-name">AR TRADERS</div>

          <div className="shop-address">
            23/11, MOUNT ROAD, TENKASI - 627811.
          </div>

          <div className="shop-mobile">
            MOBILE: 86681 70419 / 97918 45135
          </div>

          <div className="shop-category">
            SPICES / NUTS / DRY FRUITS / IMPORTED CHOCOLATE
          </div>
        </header>

        {/* BILL TITLE AND DATE */}
        <div className="invoice-heading">
          <strong className="invoice-type">
            {type === "SALE" ? "ESTIMATE" : "PURCHASE"}
          </strong>

          <span className="invoice-date">
            தேதி: {formatDate(date)}
          </span>
        </div>

        {/* CUSTOMER AND BILL NUMBER */}
        <section className="customer-box">
          <div className="customer-left">
            <strong>TO: {partyName?.toUpperCase() || "CASH SALES"}</strong>
          </div>

          <div className="customer-right">
            <strong>{paymentMethod.toUpperCase()}</strong>
            <div className="payment-label">பில் எண்</div>
            <div className="invoice-number">{invoiceNumber}</div>
          </div>
        </section>

        {/* PRODUCT TABLE */}
        <table className="thermal-items">
          <colgroup>
            <col className="price-column" />
            <col className="product-column" />
            <col className="quantity-column" />
            <col className="amount-column" />
          </colgroup>

          <thead>
            <tr>
              <th>விலை</th>
              <th>பொருள்</th>
              <th>அளவு</th>
              <th>மொத்தம்</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => {
              const rate = item.price ?? item.purchaseRate ?? 0;

              return (
                <tr key={`${item.productCode ?? item.productName}-${index}`}>
                  {/* UNIT PRICE ON LEFT */}
                  <td className="price-cell">
                    {formatCurrency(rate)}
                  </td>

                  {/* PRODUCT NAME */}
                  <td className="product-cell">
                    <div className="product-name">
                      {item.productName.toUpperCase()}
                    </div>
                  </td>

                  {/* QUANTITY */}
                  <td className="quantity-cell">
                    {Number(item.quantity).toFixed(
                      Number.isInteger(Number(item.quantity)) ? 0 : 3
                    )}
                    {item.unit && ` ${item.unit.toUpperCase()}`}
                  </td>

                  {/* LINE TOTAL */}
                  <td className="amount-cell">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* BILL SUMMARY */}
        <section className="summary-box">
          <div className="summary-row">
            <span>பில் தொகை:</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>

          {discount > 0 && (
            <div className="summary-row">
              <span>DISCOUNT:</span>
              <strong>{formatCurrency(discount)}</strong>
            </div>
          )}

          {gst > 0 && (
            <div className="summary-row">
              <span>GST:</span>
              <strong>{formatCurrency(gst)}</strong>
            </div>
          )}

          {roundOff !== 0 && (
            <div className="summary-row">
              <span>ROUND OFF:</span>
              <strong>{formatCurrency(roundOff)}</strong>
            </div>
          )}
        </section>

        {/* GRAND TOTAL */}
        <section className="grand-total-box">
          <div className="summary-row grand-total-row">
            <span>E. &amp; O.E. மொத்த தொகை:</span>
            <strong>{formatCurrency(grandTotal)}</strong>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="thermal-footer">
          நன்றி! மீண்டும் வருக!
        </footer>
      </div>

      {/* ALL STYLES ARE INSIDE THIS COMPONENT */}
      <style>{`
        /* 80MM THERMAL RECEIPT */

        .thermal-invoice,
        .regular-invoice {
          box-sizing: border-box;
          background: #fff;
          color: #000;
          font-family: Arial, "Noto Sans Tamil", sans-serif;
          text-transform: uppercase;
          font-weight: 700;
        }

        .thermal-invoice *,
        .regular-invoice * {
          box-sizing: border-box;
        }

        .thermal-invoice {
          display: block;
          width: 80mm;
          max-width: 80mm;
          height: auto;
          min-height: 0;
          margin: 0 auto;
          padding: 3mm 4mm;
          font-size: 10px;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }

        /* HEADER */

        .thermal-header {
          width: 100%;
          border: 1px solid #555;
          border-radius: 12px;
          text-align: center;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .shop-name {
          padding-top: 5px;
          font-size: 19px;
          line-height: 23px;
          font-weight: 800;
        }

        .shop-address {
          padding: 3px 3px 0;
          font-size: 9px;
          line-height: 12px;
        }

        .shop-mobile {
          padding: 2px 2px 4px;
          font-size: 9px;
          line-height: 12px;
        }

        .shop-category {
          padding: 4px 2px;
          border-top: 1px solid #555;
          font-size: 9px;
          line-height: 12px;
        }

        /* TITLE AND DATE */

        .invoice-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 3px;
          margin-top: 5px;
          min-height: 18px;
        }

        .invoice-type {
          display: inline-block;
          flex-shrink: 0;
          padding: 2px 4px;
          background: #555;
          color: #fff;
          font-size: 10px;
          line-height: 13px;
        }

        .invoice-date {
          font-size: 9px;
          white-space: nowrap;
        }

        /* CUSTOMER BOX */

        .customer-box {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 27%;
          margin-top: 4px;
          border: 1px solid #555;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .customer-left {
          min-width: 0;
          padding: 6px 4px;
          font-size: 11px;
          line-height: 14px;
          overflow-wrap: anywhere;
        }

        .customer-right {
          min-width: 0;
          padding: 5px 4px;
          border-left: 1px solid #555;
          font-size: 10px;
          line-height: 13px;
          overflow-wrap: anywhere;
        }

        .payment-label {
          margin-top: 3px;
          font-size: 10px;
        }

        .invoice-number {
          font-size: 11px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        /* PRODUCT TABLE */

        .thermal-items {
          width: 100%;
          margin: 4px 0 0;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 9px;
        }

        .thermal-items .price-column {
          width: 22%;
        }

        .thermal-items .product-column {
          width: 31%;
        }

        .thermal-items .quantity-column {
          width: 23%;
        }

        .thermal-items .amount-column {
          width: 24%;
        }

        .thermal-items thead {
          display: table-header-group;
        }

        .thermal-items thead tr {
          border: 1px solid #555;
        }

        .thermal-items th {
          padding: 4px 1px;
          text-align: center;
          font-weight: 700;
          border-right: 1px solid #555;
          overflow-wrap: anywhere;
        }

        .thermal-items th:last-child {
          border-right: 0;
        }

        .thermal-items td {
          padding: 4px 1px;
          vertical-align: top;
          overflow-wrap: anywhere;
        }

        .thermal-items tbody tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .price-cell {
          text-align: center;
          white-space: normal;
          overflow-wrap: anywhere;
          font-size: 10px;
          font-weight: 700;
        }

        .product-cell {
          text-align: center;
        }

        .product-name {
          text-align: center;
          font-weight: 700;
          text-transform: uppercase;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .quantity-cell {
          text-align: center;
          overflow-wrap: anywhere;
        }

        .amount-cell {
          text-align: right;
          white-space: nowrap;
          font-weight: 700;
        }

        /* SUMMARY */

        .summary-box {
          margin-top: 4px;
          border: 1px solid #555;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 5px;
          padding: 5px 4px;
          font-size: 10px;
          line-height: 14px;
        }

        .summary-row strong {
          font-size: 11px;
          white-space: nowrap;
        }

        /* GRAND TOTAL */

        .grand-total-box {
          border: 1px solid #555;
          border-top: 0;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .grand-total-row {
          font-weight: 700;
        }

        .grand-total-row strong {
          font-size: 12px;
        }

        /* FOOTER */

        .thermal-footer {
          margin-top: 6px;
          padding-bottom: 2px;
          text-align: center;
          font-size: 12px;
          line-height: 17px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* REGULAR INVOICE FALLBACK */

        .regular-invoice {
          width: 100%;
          max-width: 768px;
          margin: 0 auto;
          padding: 16px;
        }

        /* PRINT */

        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }

          html,
          body {
            width: 80mm !important;
            min-width: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #fff !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * {
            visibility: hidden;
          }

          #invoice-print,
          #invoice-print * {
            visibility: visible !important;
          }

          #invoice-print {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 !important;
            overflow: visible !important;
            box-shadow: none !important;
            transform: none !important;
            background: #fff !important;
            color: #000 !important;
          }

          #invoice-print.thermal-invoice {
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 3mm 4mm !important;
          }

          #invoice-print.regular-invoice {
            width: 100% !important;
            max-width: none !important;
            padding: 16px !important;
          }

          #invoice-print table {
            width: 100% !important;
            height: auto !important;
          }

          #invoice-print .thermal-header,
          #invoice-print .customer-box,
          #invoice-print .summary-box,
          #invoice-print .grand-total-box,
          #invoice-print .thermal-footer,
          #invoice-print tbody tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </>
  );
}
