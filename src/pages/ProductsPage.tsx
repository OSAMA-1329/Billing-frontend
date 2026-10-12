import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client';
import type { Paginated, Product } from '../types';
import { ProductFormModal, type ProductFormValues } from '../components/ProductFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { downloadExport } from '../utils/download';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

export function ProductsPage() {
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const canEdit = hasRole('ADMIN', 'MANAGER');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id?: string; bulk?: boolean } | null>(null);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => apiGet<Paginated<Product>>('/products', { page, limit: 50, search }),
  });

  const totalPages = useMemo(
    () => (data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1),
    [data]
  );

  async function saveProduct(values: ProductFormValues) {
    if (editProduct) {
      const { availableStock, ...productValues } = values;
      await apiPut(`/products/${editProduct._id}`, productValues);
      if (availableStock !== undefined) {
        const currentProduct = await apiGet<Product>(`/products/${editProduct._id}`);
        const stockDelta = availableStock - currentProduct.availableStock;
        if (stockDelta !== 0) {
          await apiPost('/stock/adjustment', {
            productId: editProduct._id,
            quantity: stockDelta,
            unit: currentProduct.unit,
            note: 'Product edit stock adjustment',
          });
        }
      }
      toast.success('Product updated');
    } else {
      await apiPost('/products', values);
      toast.success('Product created');
    }
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['products'] }),
      qc.invalidateQueries({ queryKey: ['stock'] }),
      qc.invalidateQueries({ queryKey: ['stock-movements'] }),
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Product Management</h1>
          <p className="text-sm text-slate-600">Add, edit & delete products</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditProduct(null);
                setModalOpen(true);
              }}
            >
              Add Product
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={() => refetch()}>
            Refresh
          </button>
          {canEdit && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => downloadExport('/products/export', 'products.xlsx')}
            >
              Export Excel
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={() => window.print()}>
            Print Stock Value
          </button>
        </div>
      </div>

      <div className="card flex flex-wrap items-end gap-2 p-3">
        <div className="min-w-[240px] flex-1">
          <label className="label">Search Product</label>
          <input
            className="input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                setSearch(searchInput.trim());
              }
            }}
            placeholder="Name, code, barcode..."
          />
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setPage(1);
            setSearch(searchInput.trim());
          }}
        >
          Filter
        </button>
        {canEdit && (
          <button
            type="button"
            className="btn-danger"
            disabled={!Object.values(selected).some(Boolean)}
            onClick={() => setConfirmDelete({ bulk: true })}
          >
            Delete Selected
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="max-h-[calc(100vh-280px)] overflow-auto">
          <table className="table-dense w-full min-w-[1200px]">
            <thead>
              <tr>
                {canEdit && <th className="w-8"></th>}
                <th>Item Code</th>
                <th>Product Name</th>
                <th>Tamil Name</th>
                <th>Unit</th>
                <th>HSN</th>
                <th>Brand</th>
                <th>MRP</th>
                <th>Purchase</th>
                <th>Margin%</th>
                <th>GST</th>
                <th>Retail</th>
                <th>Point%</th>
                <th>Wholesale</th>
                <th>Stock</th>
                <th>Godown</th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {data?.items.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  {canEdit && (
                    <td>
                      <input
                        type="checkbox"
                        checked={!!selected[p._id]}
                        onChange={(e) =>
                          setSelected((s) => ({ ...s, [p._id]: e.target.checked }))
                        }
                      />
                    </td>
                  )}
                  <td className="font-mono text-xs">{p.itemCode}</td>
                  <td>{p.productName}</td>
                  <td>{p.tamilProductName}</td>
                  <td>{p.unit}</td>
                  <td>{p.hsnCode}</td>
                  <td>{p.manufacturer}</td>
                  <td>{formatCurrency(p.mrp)}</td>
                  <td>{formatCurrency(p.purchaseCost)}</td>
                  <td>{p.marginPercent}</td>
                  <td>{p.gstPercent}%</td>
                  <td>{formatCurrency(p.retailPrice)}</td>
                  <td>{p.pointPercent}</td>
                  <td>{formatCurrency(p.wholesalePrice)}</td>
                  <td className={p.availableStock <= (p.lowStockThreshold ?? 5) ? 'font-semibold text-amber-700' : ''}>
                    {p.availableStock}
                  </td>
                  <td>{p.godownLocation}</td>
                  {canEdit && (
                    <td>
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => {
                          setEditProduct(p);
                          setModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-sm">
          <span>
            Page {page} / {totalPages} · {data?.total ?? 0} products {isFetching ? '(loading...)' : ''}
          </span>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editProduct}
        onSubmit={saveProduct}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete products?"
        message="This action cannot be undone."
        danger
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          try {
            if (confirmDelete?.bulk) {
              const ids = Object.entries(selected)
                .filter(([, v]) => v)
                .map(([id]) => id);
              await apiPost('/products/bulk-delete', { ids });
              setSelected({});
            } else if (confirmDelete?.id) {
              await apiDelete(`/products/${confirmDelete.id}`);
            }
            toast.success('Deleted');
            qc.invalidateQueries({ queryKey: ['products'] });
          } catch {
            toast.error('Delete failed');
          } finally {
            setConfirmDelete(null);
          }
        }}
      />
    </div>
  );
}
