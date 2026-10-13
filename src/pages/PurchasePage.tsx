import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiDelete, apiErrorMessage, apiGet, apiPost, apiPut } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { InvoicePrint } from '../components/InvoicePrint';
import { ProductFormModal, type ProductFormValues } from '../components/ProductFormModal';
import type { Paginated, Product, Supplier } from '../types';
import { computeRoundOff, formatCurrency, formatDate, round2 } from '../utils/format';

type PurchaseStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

interface PurchaseLine {
	product: Product;
	quantity: number;
	purchaseRate: number;
}

interface PurchaseItemPayload {
	productId: string;
	productCode: string;
	productName: string;
	quantity: number;
	mrp: number;
	crossAmount: number;
	purchaseRate: number;
	pdPercent: number;
	marginPercent: number;
	retailPrice: number;
	wholesalePrice: number;
	total: number;
}

interface PurchaseInvoice {
	_id: string;
	invoiceNumber: string;
	supplierName: string;
	invoiceDate: string;
	items: PurchaseItemPayload[];
	productsValue: number;
	lessAmount: number;
	roundOff: number;
	totalAmount: number;
	status: PurchaseStatus;
}

function localDateValue() {
	const date = new Date();
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function PurchasePage() {
	const queryClient = useQueryClient();
	const [productSearch, setProductSearch] = useState('');
	const [cart, setCart] = useState<PurchaseLine[]>([]);
	const [supplierId, setSupplierId] = useState('');
	const [externalInvoiceNumber, setExternalInvoiceNumber] = useState('');
	const [serialNumber, setSerialNumber] = useState('');
	const [invoiceDate, setInvoiceDate] = useState(localDateValue);
	const [invoiceMode, setInvoiceMode] = useState('Cash');
	const [status, setStatus] = useState<PurchaseStatus>('COMPLETED');
	const [lessInput, setLessInput] = useState('0');
	const [deleteTarget, setDeleteTarget] = useState<PurchaseInvoice | null>(null);
	const [lastInvoice, setLastInvoice] = useState<PurchaseInvoice | null>(null);
	const [productFormOpen, setProductFormOpen] = useState(false);

	const products = useQuery({
		queryKey: ['purchase-products', productSearch],
		queryFn: () => apiGet<Paginated<Product>>('/products', { page: 1, limit: 12, search: productSearch.trim() }),
	});
	const suppliers = useQuery({
		queryKey: ['suppliers', 'purchase'],
		queryFn: () => apiGet<Paginated<Supplier>>('/suppliers', { page: 1, limit: 250 }),
	});
	const purchases = useQuery({
		queryKey: ['purchases', 'recent'],
		queryFn: () => apiGet<Paginated<PurchaseInvoice>>('/purchases', { page: 1, limit: 12 }),
	});
	const createCatalogProduct = useMutation({
		mutationFn: (values: ProductFormValues) => apiPost<Product>('/products', { ...values, openingStock: 0 }),
		onSuccess: async (product) => {
			addProduct(product);
			setProductSearch('');
			setProductFormOpen(false);
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['products'] }),
				queryClient.invalidateQueries({ queryKey: ['purchase-products'] }),
			]);
			toast.success('Product added to this purchase');
		},
		onError: () => toast.error('Product could not be created. Check its code and required fields.'),
	});

	const productsValue = useMemo(
		() => round2(cart.reduce((sum, line) => sum + line.purchaseRate * line.quantity, 0)),
		[cart]
	);
	const lessAmount = Math.min(productsValue, Math.max(0, Number(lessInput) || 0));
	const totals = computeRoundOff(productsValue - lessAmount);
	const selectedSupplier = suppliers.data?.items.find((supplier) => supplier._id === supplierId);

	const createPurchase = useMutation({
		mutationFn: (payload: Record<string, unknown>) => apiPost<PurchaseInvoice>('/purchases', payload),
		onSuccess: async (invoice) => {
			setLastInvoice(invoice);
			setCart([]);
			setLessInput('0');
			setExternalInvoiceNumber('');
			setSerialNumber('');
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['purchases'] }),
				queryClient.invalidateQueries({ queryKey: ['products'] }),
				queryClient.invalidateQueries({ queryKey: ['stock'] }),
				queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
			]);
			toast.success(`${invoice.invoiceNumber} saved`);
		},
		onError: () => toast.error('Purchase could not be saved. Please check the details.'),
	});

	const deletePurchase = useMutation({
		mutationFn: (id: string) => apiDelete(`/purchases/${id}`),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['purchases'] }),
				queryClient.invalidateQueries({ queryKey: ['products'] }),
				queryClient.invalidateQueries({ queryKey: ['stock'] }),
			]);
			setDeleteTarget(null);
			toast.success('Purchase deleted and stock reversed where applicable');
		},
		onError: () => toast.error('Purchase could not be deleted.'),
	});

	function addProduct(product: Product) {
		setCart((current) => {
			const existing = current.find((line) => line.product._id === product._id);
			return existing
				? current.map((line) => line.product._id === product._id ? { ...line, quantity: line.quantity + 1 } : line)
				: [...current, { product, quantity: 1, purchaseRate: product.purchaseCost }];
		});
	}

	function submitPurchase() {
		if (!cart.length) {
			toast.error('Add at least one product to the purchase.');
			return;
		}
		if (!selectedSupplier) {
			toast.error('Select a supplier.');
			return;
		}

		const items = cart.map(({ product, quantity, purchaseRate }) => {
			const total = round2(quantity * purchaseRate);
			return {
				productId: product._id,
				productCode: product.itemCode,
				productName: product.productName,
				quantity,
				mrp: product.mrp,
				crossAmount: total,
				purchaseRate,
				pdPercent: 0,
				marginPercent: product.marginPercent,
				retailPrice: product.retailPrice,
				wholesalePrice: product.wholesalePrice,
				total,
			} satisfies PurchaseItemPayload;
		});

		createPurchase.mutate({
			serialNumber: serialNumber.trim(),
			supplierId,
			supplierName: selectedSupplier.name,
			place: selectedSupplier.place || '',
			invoiceDate,
			invoiceMode,
			externalInvoiceNumber: externalInvoiceNumber.trim(),
			items,
			productsValue,
			lessAmount,
			roundOff: totals.roundOff,
			totalAmount: totals.finalTotal,
			status,
		});
	}

	const markCompleted = useMutation({
		mutationFn: (invoice: PurchaseInvoice) => apiPut(`/purchases/${invoice._id}`, { status: 'COMPLETED' }),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['purchases'] }),
				queryClient.invalidateQueries({ queryKey: ['products'] }),
				queryClient.invalidateQueries({ queryKey: ['stock'] }),
			]);
			toast.success('Purchase posted to stock');
		},
		onError: () => toast.error('Purchase could not be completed.'),
	});

	return (
		<div className="page-stack">
			<header className="page-heading">
				<div><p className="eyebrow">Inventory intake</p><h1>Purchases</h1><p>Record supplier invoices and post received quantities to stock.</p></div>
				{lastInvoice && <button type="button" className="btn-secondary" onClick={() => window.print()}>Print {lastInvoice.invoiceNumber}</button>}
			</header>

			<div className="purchase-grid">
				<section className="data-panel">
					<div className="panel-heading"><div><h2>Invoice details</h2><p>Supplier and reference information</p></div></div>
					<div className="purchase-meta-grid">
						<div className="sm:col-span-2">
							<label className="label" htmlFor="purchase-supplier">Supplier *</label>
							<select id="purchase-supplier" className="input" value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
								<option value="">Choose a supplier</option>
								{suppliers.data?.items.map((supplier) => <option key={supplier._id} value={supplier._id}>{supplier.name}</option>)}
							</select>
						</div>
						<div><label className="label" htmlFor="purchase-date">Invoice date *</label><input id="purchase-date" className="input" type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} /></div>
						<div><label className="label" htmlFor="purchase-external">Supplier invoice no.</label><input id="purchase-external" className="input" maxLength={60} value={externalInvoiceNumber} onChange={(event) => setExternalInvoiceNumber(event.target.value)} /></div>
						<div><label className="label" htmlFor="purchase-serial">Serial number</label><input id="purchase-serial" className="input" maxLength={60} value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} /></div>
						<div><label className="label" htmlFor="purchase-mode">Invoice mode</label><select id="purchase-mode" className="input" value={invoiceMode} onChange={(event) => setInvoiceMode(event.target.value)}><option>Cash</option><option>Credit</option><option>Bank transfer</option><option>UPI</option></select></div>
					</div>
				</section>

				<section className="data-panel">
					<div className="panel-heading">
						<div><h2>Add items</h2><p>Search the catalog or create a product for this purchase</p></div>
						<div className="heading-actions">
							<span className="count-pill">{products.data?.total ?? 0} matches</span>
							<button type="button" className="btn-secondary" onClick={() => setProductFormOpen(true)}>Add new product</button>
						</div>
					</div>
					<div className="px-4"><label className="sr-only" htmlFor="purchase-product-search">Search products</label>
					<input
						id="purchase-product-search"
						className="input"
						value={productSearch}
						onChange={(event) => setProductSearch(event.target.value)}
						onKeyDown={async (event) => {
							if (event.key !== 'Enter') return;

							const barcode = productSearch.trim();
							if (!barcode) return;

							event.preventDefault();

							try {
								const result = await apiGet<Paginated<Product>>(
									'/products',
									{ barcode, page: 1, limit: 1 },
								);

								const product = result.items[0];
								if (!product) {
									toast.error(`No product found for barcode ${barcode}.`);
									return;
								}

								addProduct(product);
								setProductSearch('');
							} catch (error) {
								toast.error(
									apiErrorMessage(error, 'Barcode lookup failed.'),
								);
							}
						}}
						placeholder="Scan barcode or find a product"
					/>
					</div>
					<div className="product-pick-list purchase-product-list">
						{products.isPending && <p className="empty-state">Loading products...</p>}
						{products.isError && <p className="empty-state text-red-700">Products could not be loaded.</p>}
						{products.data?.items.map((product) => (
							<button key={product._id} type="button" className="product-pick" onClick={() => addProduct(product)}>
								<span className="product-pick-copy"><strong>{product.productName}</strong><span>{product.itemCode} · Stock {product.availableStock}</span></span>
								<span className="product-pick-price">{formatCurrency(product.purchaseCost)}</span>
							</button>
						))}
						{!products.isPending && !products.isError && !products.data?.items.length && <p className="empty-state">No matching products.</p>}
					</div>
				</section>

				<section className="data-panel purchase-cart-panel">
					<div className="panel-heading"><div><h2>Invoice items</h2><p>{cart.length} {cart.length === 1 ? 'item' : 'items'}</p></div>{cart.length > 0 && <button type="button" className="table-action table-action-danger" onClick={() => setCart([])}>Clear</button>}</div>
					{cart.length ? (
						<div className="table-scroll">
							<table className="table-dense w-full min-w-[620px]">
								<thead><tr><th>Product</th><th>Quantity</th><th>Purchase rate</th><th className="text-right">Amount</th><th></th></tr></thead>
								<tbody>
									{cart.map(({ product, quantity, purchaseRate }) => (
										<tr key={product._id}>
											<td><strong>{product.productName}</strong><span className="block text-xs text-slate-500">{product.itemCode}</span></td>
											<td><input aria-label={`Quantity for ${product.productName}`} className="input qty-input" type="number" min="0.01" step="0.01" value={quantity} onChange={(event) => { const value = Number(event.target.value); if (value > 0) setCart((current) => current.map((line) => line.product._id === product._id ? { ...line, quantity: value } : line)); }} /></td>
											<td><input aria-label={`Purchase rate for ${product.productName}`} className="input price-input" type="number" min="0" step="0.01" value={purchaseRate} onChange={(event) => setCart((current) => current.map((line) => line.product._id === product._id ? { ...line, purchaseRate: Math.max(0, Number(event.target.value) || 0) } : line))} /></td>
											<td className="text-right font-semibold">{formatCurrency(quantity * purchaseRate)}</td>
											<td><button type="button" className="table-action table-action-danger" aria-label={`Remove ${product.productName}`} onClick={() => setCart((current) => current.filter((line) => line.product._id !== product._id))}>Remove</button></td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : <div className="empty-state">Choose products above to add invoice lines.</div>}

					<div className="purchase-summary-controls">
						<label className="inline-field" htmlFor="purchase-less">Less amount <input id="purchase-less" type="number" className="input" min="0" step="0.01" value={lessInput} onChange={(event) => setLessInput(event.target.value)} /></label>
						<label className="inline-field" htmlFor="purchase-status">Posting status <select id="purchase-status" className="input" value={status} onChange={(event) => setStatus(event.target.value as PurchaseStatus)}><option value="COMPLETED">Complete and update stock</option><option value="PENDING">Save as pending</option></select></label>
					</div>
					<div className="bill-totals"><div><span>Products value</span><strong>{formatCurrency(productsValue)}</strong></div><div><span>Less amount</span><strong>−{formatCurrency(lessAmount)}</strong></div><div><span>Round off</span><strong>{formatCurrency(totals.roundOff)}</strong></div><div className="bill-grand-total"><span>Total amount</span><strong>{formatCurrency(totals.finalTotal)}</strong></div></div>
					<button type="button" className="btn-primary checkout-button" disabled={!cart.length || createPurchase.isPending} onClick={submitPurchase}>{createPurchase.isPending ? 'Saving purchase...' : `${status === 'COMPLETED' ? 'Complete purchase' : 'Save pending'} · ${formatCurrency(totals.finalTotal)}`}</button>
				</section>
			</div>

			<section className="data-panel">
				<div className="panel-heading"><div><h2>Recent purchases</h2><p>Supplier invoices and stock posting status</p></div><button type="button" className="btn-secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ['purchases'] })}>Refresh</button></div>
				{purchases.isError ? <p className="empty-state text-red-700">Purchases could not be loaded.</p> : (
					<div className="table-scroll"><table className="table-dense w-full min-w-[760px]">
						<thead><tr><th>Invoice</th><th>Supplier</th><th>Date</th><th>Status</th><th className="text-right">Total</th><th className="text-right">Actions</th></tr></thead>
						<tbody>{purchases.data?.items.map((invoice) => <tr key={invoice._id}>
							<td className="font-mono text-xs font-semibold">{invoice.invoiceNumber}</td><td>{invoice.supplierName}</td><td>{formatDate(invoice.invoiceDate)}</td>
							<td><span className={`status-pill ${invoice.status === 'COMPLETED' ? 'status-pill-good' : 'status-pill-wait'}`}>{invoice.status}</span></td>
							<td className="text-right font-semibold">{formatCurrency(invoice.totalAmount)}</td>
							<td><div className="flex justify-end gap-2">{invoice.status === 'PENDING' && <button type="button" className="table-action" disabled={markCompleted.isPending} onClick={() => markCompleted.mutate(invoice)}>Complete</button>}<button type="button" className="table-action table-action-danger" onClick={() => setDeleteTarget(invoice)}>Delete</button></div></td>
						</tr>)}</tbody>
					</table></div>
				)}
			</section>

			<ConfirmDialog open={!!deleteTarget} title="Delete purchase?" message={`Delete ${deleteTarget?.invoiceNumber ?? 'this purchase'}? If it was completed, its stock movement will be reversed.`} danger confirmLabel={deletePurchase.isPending ? 'Deleting...' : 'Delete purchase'} onCancel={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && deletePurchase.mutate(deleteTarget._id)} />
			<ProductFormModal
				open={productFormOpen}
				onClose={() => setProductFormOpen(false)}
				onSubmit={async (values) => { await createCatalogProduct.mutateAsync(values); }}
			/>
			{lastInvoice && <InvoicePrint type="PURCHASE" invoiceNumber={lastInvoice.invoiceNumber} partyName={lastInvoice.supplierName} date={lastInvoice.invoiceDate} items={lastInvoice.items} subtotal={lastInvoice.productsValue} discount={lastInvoice.lessAmount} roundOff={lastInvoice.roundOff} grandTotal={lastInvoice.totalAmount} />}
		</div>
	);
}
