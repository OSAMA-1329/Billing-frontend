import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiGet, apiPost } from '../api/client';
import { Modal } from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import type { Paginated } from '../types';
import { downloadExport } from '../utils/download';
import { formatCurrency, formatDate } from '../utils/format';
import { getCompatibleUnits } from '../utils/units';

interface StockProduct {
  _id: string;
  itemCode: string;
  productName: string;
  unit: string;
  availableStock: number;
  purchaseCost: number;
  retailPrice: number;
  godownLocation?: string;
}

interface StockMovement {
  _id: string;
  productId: string | { _id: string; itemCode: string; productName: string };
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  unit?: string;
  baseQuantity?: number;
  baseUnit?: 'g' | 'ml' | 'pcs';
  previousStock: number;
  newStock: number;
  referenceNumber?: string;
  createdAt: string;
}

export function StockPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canAdjust = hasRole('ADMIN', 'MANAGER');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [adjustmentUnit, setAdjustmentUnit] = useState('Pcs');
  const [quantityInput, setQuantityInput] = useState('');
  const [note, setNote] = useState('');

  const stock = useQuery({
    queryKey: ['stock', page, search],
    queryFn: () => apiGet<Paginated<StockProduct>>('/stock', { page, limit: 50, search }),
  });
  const movements = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => apiGet<Paginated<StockMovement>>('/stock/movements', { page: 1, limit: 20 }),
  });
  const adjustStock = useMutation({
    mutationFn: () => apiPost('/stock/adjustment', {
      productId,
      quantity: Number(quantityInput),
      unit: adjustmentUnit,
      note: note.trim() || undefined,
    }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stock'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      setAdjustmentOpen(false);
      setProductId('');
      setQuantityInput('');
      setNote('');
      toast.success('Stock adjustment recorded');
    },
    onError: () => toast.error('Stock could not be adjusted. Check available quantity and try again.'),
  });

  const totalUnits = stock.data?.items.reduce((sum, product) => sum + product.availableStock, 0) ?? 0;
  const stockValue = stock.data?.items.reduce((sum, product) => sum + product.availableStock * product.purchaseCost, 0) ?? 0;
  const selectedProduct = stock.data?.items.find((product) => product._id === productId);
  const totalPages = stock.data ? Math.max(1, Math.ceil(stock.data.total / stock.data.limit)) : 1;

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div><p className="eyebrow">Inventory control</p><h1>Stock</h1><p>Monitor on-hand quantities and keep a clear adjustment history.</p></div>
        <div className="heading-actions">
          {canAdjust && <button type="button" className="btn-secondary" onClick={() => downloadExport('/stock/export', 'stock.xlsx')}>Export</button>}
          {canAdjust && <button type="button" className="btn-primary" onClick={() => setAdjustmentOpen(true)}>Adjust stock</button>}
        </div>
      </header>

      <div className="metric-strip">
        <div className="metric-tile metric-mint"><span>Units on this page</span><strong>{totalUnits.toLocaleString('en-IN')}</strong></div>
        <div className="metric-tile metric-peach"><span>Purchase value on this page</span><strong>{formatCurrency(stockValue)}</strong></div>
        <div className="metric-tile metric-lilac"><span>Products in catalog</span><strong>{(stock.data?.total ?? 0).toLocaleString('en-IN')}</strong></div>
      </div>

      <section className="data-panel">
        <div className="panel-heading"><div><h2>On-hand inventory</h2><p>Stock value is estimated at purchase cost.</p></div><span className="count-pill">{stock.data?.total ?? 0} products</span></div>
        <div className="toolbar-row">
          <form className="search-form" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }}>
            <label className="sr-only" htmlFor="stock-search">Search inventory</label>
            <input id="stock-search" className="input" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Product name or item code" />
            <button type="submit" className="btn-secondary">Search</button>
          </form>
          <span className="result-count">Page {page} of {totalPages}</span>
        </div>
        {stock.isPending ? <p className="empty-state">Loading stock...</p> : stock.isError ? <p className="empty-state text-red-700">Stock could not be loaded.</p> : stock.data.items.length ? (
          <div className="table-scroll">
            <table className="table-dense w-full min-w-[740px]">
              <thead><tr><th>Item code</th><th>Product</th><th>Location</th><th className="text-right">On hand</th><th className="text-right">Purchase value</th><th className="text-right">Retail value</th></tr></thead>
              <tbody>{stock.data.items.map((product) => (
                <tr key={product._id}>
                  <td className="font-mono text-xs">{product.itemCode}</td><td className="font-semibold text-slate-900">{product.productName}</td><td>{product.godownLocation || '—'}</td>
                  <td className="text-right tabular-nums"><span className={product.availableStock <= 5 ? 'stock-low' : 'stock-normal'}>{product.availableStock} {product.unit}</span></td>
                  <td className="text-right">{formatCurrency(product.availableStock * product.purchaseCost)}</td><td className="text-right">{formatCurrency(product.availableStock * product.retailPrice)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="empty-state">No products match your search.</div>}
        <div className="table-footer"><span>Showing {stock.data?.items.length ?? 0} of {stock.data?.total ?? 0}</span><div className="flex gap-2"><button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><button type="button" className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
      </section>

      <section className="data-panel">
        <div className="panel-heading"><div><h2>Recent movements</h2><p>Purchases, sales, returns, and manual adjustments</p></div></div>
        {movements.isError ? <p className="empty-state text-red-700">Stock movements could not be loaded.</p> : movements.isPending ? <p className="empty-state">Loading movements...</p> : movements.data.items.length ? (
          <div className="table-scroll"><table className="table-dense w-full min-w-[680px]">
            <thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Reference</th><th className="text-right">Change</th><th className="text-right">Balance</th></tr></thead>
            <tbody>{movements.data.items.map((movement) => {
              const product = typeof movement.productId === 'string' ? null : movement.productId;
              return <tr key={movement._id}><td>{formatDate(movement.createdAt)}</td><td>{product ? `${product.productName} (${product.itemCode})` : 'Product'}</td><td><span className="status-pill">{movement.type}</span></td><td>{movement.referenceNumber || '—'}</td><td className={`text-right font-semibold ${movement.quantity < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{movement.quantity > 0 ? '+' : ''}{movement.quantity} {movement.unit ?? ''}</td><td className="text-right">{movement.previousStock} → {movement.newStock} {movement.unit ?? ''}</td></tr>;
            })}</tbody>
          </table></div>
        ) : <div className="empty-state">No stock movements recorded yet.</div>}
      </section>

      <Modal open={canAdjust && adjustmentOpen} title="Adjust inventory" onClose={() => setAdjustmentOpen(false)}>
        <form className="form-grid" onSubmit={(event) => { event.preventDefault(); if (!productId || !Number(quantityInput)) { toast.error('Choose a product and enter a non-zero quantity.'); return; } adjustStock.mutate(); }}>
          <div className="sm:col-span-2"><label className="label" htmlFor="adjust-product">Product</label><select id="adjust-product" required className="input" value={productId} onChange={(event) => { const nextId = event.target.value; setProductId(nextId); const product = stock.data?.items.find((item) => item._id === nextId); if (product) setAdjustmentUnit(product.unit); }}><option value="">Choose product</option>{stock.data?.items.map((product) => <option key={product._id} value={product._id}>{product.itemCode} · {product.productName}</option>)}</select>{selectedProduct && <p className="mt-1 text-xs text-slate-500">Current stock: {selectedProduct.availableStock} {selectedProduct.unit}</p>}</div>
          <div><label className="label" htmlFor="adjust-unit">Unit</label><select id="adjust-unit" className="input" value={adjustmentUnit} onChange={(event) => setAdjustmentUnit(event.target.value)}>{getCompatibleUnits(selectedProduct?.unit ?? 'Pcs').map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></div>
          <div><label className="label" htmlFor="adjust-quantity">Quantity change</label><input id="adjust-quantity" required className="input" type="number" step={adjustmentUnit === 'Kg' || adjustmentUnit === 'L' ? '0.001' : '1'} value={quantityInput} onChange={(event) => setQuantityInput(event.target.value)} placeholder="+ add / − remove" /><p className="mt-1 text-xs text-slate-500">Positive adds stock; negative removes it.</p></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="adjust-note">Reason / reference</label><input id="adjust-note" maxLength={120} className="input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Opening count correction" /></div>
          <div className="sm:col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-3"><button type="button" className="btn-secondary" onClick={() => setAdjustmentOpen(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={adjustStock.isPending}>{adjustStock.isPending ? 'Saving...' : 'Record adjustment'}</button></div>
        </form>
      </Modal>
    </div>
  );
}