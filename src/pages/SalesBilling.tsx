import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiErrorMessage, apiGet, apiPost } from '../api/client';
import { InvoicePrint } from '../components/InvoicePrint';
import type { Customer, Paginated, Product } from '../types';
import { formatCurrency, formatDate, round2 } from '../utils/format';
import { calculateUnitPriceAmount, convertFromBaseQuantity, convertQuantity, convertToBaseQuantity, getBaseUnit, getCompatibleUnits } from '../utils/units';

type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Credit';

interface CartLine {
	product: Product;
	quantity: number;
	unit: string;
	price: number;
}

interface SaleLinePayload {
	productId: string;
	productCode: string;
	productName: string;
	quantity: number;
	unit?: string;
	baseQuantity?: number;
	baseUnit?: 'g' | 'ml' | 'pcs';
	priceUnit?: string;
	price: number;
	retailPrice: number;
	wholesalePrice: number;
	discount: number;
	gst: number;
	total: number;
}

interface SaleInvoice {
	_id: string;
	invoiceNumber: string;
	customerName: string;
	createdAt: string;
	items: SaleLinePayload[];
	subtotal: number;
	discount: number;
	gst: number;
	roundOff: number;
	grandTotal: number;
	paidAmount: number;
	paymentMethod: PaymentMethod;
}

function getLineAmount(line: CartLine) {
	return round2(calculateUnitPriceAmount(line.quantity, line.unit, line.price, line.product.unit));
}

function getProductBaseStock(product: Product) {
	return product.stockBaseQuantity ?? convertToBaseQuantity(product.availableStock, product.unit);
}

export function SalesBillingPage() {
	const queryClient = useQueryClient();
	const [productSearch, setProductSearch] = useState('');
	const [cart, setCart] = useState<CartLine[]>([]);
	const [customerId, setCustomerId] = useState('');
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
	const [creditPaid, setCreditPaid] = useState('0');
	const [discountInput, setDiscountInput] = useState('0');
	const [lastInvoice, setLastInvoice] = useState<SaleInvoice | null>(null);

	useEffect(() => {
		if (!lastInvoice) return;
		const printTimer = window.setTimeout(() => window.print(), 50);
		return () => window.clearTimeout(printTimer);
	}, [lastInvoice]);

	const products = useQuery({
		queryKey: ['billing-products', productSearch],
		queryFn: () => apiGet<Paginated<Product>>('/products', { page: 1, limit: 12, search: productSearch.trim() }),
	});
	const customers = useQuery({
		queryKey: ['customers', 'billing'],
		queryFn: () => apiGet<Paginated<Customer>>('/customers', { page: 1, limit: 250 }),
	});
	const recentSales = useQuery({
		queryKey: ['sales', 'recent'],
		queryFn: () => apiGet<Paginated<SaleInvoice>>('/sales', { page: 1, limit: 8 }),
	});

	const subtotal = useMemo(
		() => round2(cart.reduce((sum, line) => sum + getLineAmount(line), 0)),
		[cart]
	);
	const discount = Math.min(subtotal, Math.max(0, Number(discountInput) || 0));
	const previewLines = useMemo(() => {
		let allocatedDiscount = 0;
		return cart.map((line, index) => {
			const lineSubtotal = getLineAmount(line);
			const remainingDiscount = round2(Math.max(0, discount - allocatedDiscount));
			const lineDiscount = index === cart.length - 1
				? remainingDiscount
				: Math.min(remainingDiscount, round2(discount * lineSubtotal / (subtotal || 1)));
			allocatedDiscount = round2(allocatedDiscount + lineDiscount);
			return round2((lineSubtotal - lineDiscount) * line.product.gstPercent / 100);
		});
	}, [cart, discount, subtotal]);
	const gst = round2(previewLines.reduce((sum, lineGst) => sum + lineGst, 0));
	const totals = { roundOff: 0, finalTotal: round2(subtotal + gst - discount) };
	const paidAmount = paymentMethod === 'Credit' ? Math.min(totals.finalTotal, Math.max(0, Number(creditPaid) || 0)) : totals.finalTotal;
	const balanceAmount = round2(Math.max(0, totals.finalTotal - paidAmount));

	const createSale = useMutation({
		mutationFn: (payload: Record<string, unknown>) => apiPost<SaleInvoice>('/sales', payload),
		onSuccess: async (invoice) => {
			setLastInvoice(invoice);
			setCart([]);
			setDiscountInput('0');
			setCreditPaid('0');
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['sales'] }),
				queryClient.invalidateQueries({ queryKey: ['products'] }),
				queryClient.invalidateQueries({ queryKey: ['billing-products'] }),
				queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
			]);
			toast.success(`Invoice ${invoice.invoiceNumber} created`);
		},
		onError: (error) => toast.error(apiErrorMessage(error, 'Sale could not be completed. Check stock and try again.')),
	});

	function addProduct(product: Product) {
		if (getProductBaseStock(product) <= 0) {
			toast.error('This product is out of stock.');
			return;
		}
		setCart((current) => {
			const existing = current.find((line) => line.product._id === product._id);
			if (existing) {
				const availableInUnit = convertFromBaseQuantity(getProductBaseStock(product), existing.unit);
				if (existing.quantity + 1 > availableInUnit) {
					toast.error('Quantity exceeds available stock.');
					return current;
				}
				return current.map((line) => line.product._id === product._id ? { ...line, quantity: line.quantity + 1 } : line);
			}
			return [...current, { product, quantity: 1, unit: product.unit, price: product.retailPrice }];
		});
	}

	function updateQuantity(productId: string, quantity: number) {
		setCart((current) => current.map((line) => {
			if (line.product._id !== productId) return line;
			return { ...line, quantity };
		}));
	}

	function submitSale() {
		if (!cart.length) {
			toast.error('Add at least one product to the bill.');
			return;
		}
		if (paymentMethod === 'Credit' && !customerId) {
			toast.error('Select a customer before recording a credit sale.');
			return;
		}

		const items = cart.map(({ product, quantity, unit }) => ({ productId: product._id, quantity, unit }));

		createSale.mutate({
			customerId: customerId || undefined,
			items,
			discount,
			paidAmount,
			paymentMethod,
			clientRequestId: crypto.randomUUID(),
		});
	}

	return (
		<div className="page-stack">
			<header className="page-heading">
				<div>
					<p className="eyebrow">Point of sale</p>
					<h1>Sales & billing</h1>
					<p>Scan or search products, build the basket, and complete the bill.</p>
				</div>
				{lastInvoice && (
					<button type="button" className="btn-secondary" onClick={() => window.print()}>
						Print {lastInvoice.invoiceNumber}
					</button>
				)}
			</header>

			<div className="pos-grid">
				<section className="data-panel pos-catalog">
					<div className="panel-heading">
						<div>
							<h2>Find products</h2>
							<p>Available stock is shown on each item.</p>
						</div>
						<span className="count-pill">{products.data?.total ?? 0} matches</span>
					</div>
					<label className="sr-only" htmlFor="billing-search">Search products</label>
					<input
						id="billing-search"
						autoFocus
						className="input"
						value={productSearch}
						onChange={(event) => setProductSearch(event.target.value)}
						placeholder="Product name, item code, or barcode"
					/>
					<div className="product-pick-list">
						{products.isPending ? <p className="empty-state">Loading products...</p> : null}
						{products.isError ? <p className="empty-state text-red-700">{apiErrorMessage(products.error, 'Products could not be loaded.')}</p> : null}
						{products.data?.items.map((product) => (
							<button
								key={product._id}
								type="button"
								className="product-pick"
								disabled={product.availableStock <= 0}
								onClick={() => addProduct(product)}
							>
								<span className="product-pick-copy">
									<strong>{product.productName}</strong>
									<span>{product.itemCode} · {product.availableStock} {product.unit} available</span>
								</span>
								<span className="product-pick-price">{formatCurrency(product.retailPrice)}</span>
							</button>
						))}
						{!products.isPending && !products.isError && !products.data?.items.length && (
							<p className="empty-state">No matching products.</p>
						)}
					</div>
				</section>

				<section className="data-panel pos-basket">
					<div className="panel-heading">
						<div>
							<h2>Current bill</h2>
							<p>{cart.length} {cart.length === 1 ? 'line item' : 'line items'}</p>
						</div>
						{cart.length > 0 && <button type="button" className="table-action table-action-danger" onClick={() => setCart([])}>Clear bill</button>}
					</div>

					{cart.length ? (
						<div className="table-scroll cart-table-wrap">
							<table className="table-dense w-full min-w-[610px]">
								<thead>
									<tr><th>Item</th><th>Qty</th><th>Unit</th><th>Rate</th><th className="text-right">Amount</th><th></th></tr>
								</thead>
								<tbody>
									{cart.map((line) => {
										const { product, quantity, price, unit } = line;
										const availableInUnit = convertFromBaseQuantity(getProductBaseStock(product), unit);
										return (
										<tr key={product._id}>
											<td><strong>{product.productName}</strong><span className="block text-xs text-slate-500">{product.itemCode} · {formatCurrency(price)} / {product.unit}</span></td>
											<td>
												<input
													aria-label={`Quantity for ${product.productName}`}
													className="input qty-input"
													type="number"
													min={getBaseUnit(unit) === 'pcs' ? '1' : '0.001'}
													max={availableInUnit}
													step={getBaseUnit(unit) === 'pcs' ? '1' : unit === 'Kg' || unit === 'L' ? '0.001' : '1'}
													value={quantity}
													onChange={(event) => {
														const next = Number(event.target.value);
														if (next > 0 && next <= availableInUnit && (getBaseUnit(unit) !== 'pcs' || Number.isInteger(next))) updateQuantity(product._id, next);
													}}
												/>
											</td>
												<td>
													<select
														aria-label={`Unit for ${product.productName}`}
														className="input qty-input"
														value={unit}
														onChange={(event) => {
															const nextUnit = event.target.value;
															setCart((current) => current.map((item) => item.product._id === product._id
																? { ...item, quantity: convertQuantity(item.quantity, item.unit, nextUnit), unit: nextUnit }
																: item));
														}}
													>
														{getCompatibleUnits(product.unit).map((option) => <option key={option} value={option}>{option}</option>)}
													</select>
												</td>
											<td>
												<input
													aria-label={`Price for ${product.productName}`}
													className="input price-input"
													type="number"
													min="0"
													step="0.01"
													value={price}
													readOnly
												/>
											</td>
											<td className="text-right font-semibold tabular-nums">{formatCurrency(getLineAmount(line))}</td>
											<td><button type="button" className="table-action table-action-danger" aria-label={`Remove ${product.productName}`} onClick={() => setCart((current) => current.filter((line) => line.product._id !== product._id))}>Remove</button></td>
										</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					) : (
						<div className="empty-state cart-empty"><strong>Your bill is empty</strong><p>Choose products from the catalog to begin.</p></div>
					)}

					<div className="checkout-fields">
						<div>
							<label className="label" htmlFor="sale-customer">Customer</label>
							<select id="sale-customer" className="input" value={customerId} onChange={(event) => setCustomerId(event.target.value)} disabled={customers.isError}>
								<option value="">Walk-in customer</option>
								{customers.data?.items.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}{customer.phone ? ` · ${customer.phone}` : ''}</option>)}
							</select>
							{customers.isError && <p className="field-error">{apiErrorMessage(customers.error, 'Customer list could not be loaded.')}</p>}
						</div>
						<div>
							<label className="label" htmlFor="sale-payment">Payment method</label>
							<select id="sale-payment" className="input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
								<option>Cash</option><option>Card</option><option>UPI</option><option>Credit</option>
							</select>
						</div>
						<div>
							<label className="label" htmlFor="sale-discount">Discount amount</label>
							<input id="sale-discount" className="input" type="number" min="0" max={subtotal} step="0.01" value={discountInput} onChange={(event) => setDiscountInput(event.target.value)} />
						</div>
						{paymentMethod === 'Credit' && (
							<div>
								<label className="label" htmlFor="sale-paid">Amount received</label>
								<input id="sale-paid" className="input" type="number" min="0" max={totals.finalTotal} step="0.01" value={creditPaid} onChange={(event) => setCreditPaid(event.target.value)} />
							</div>
						)}
					</div>

					<div className="bill-totals">
						<div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
						<div><span>GST</span><strong>{formatCurrency(gst)}</strong></div>
						<div><span>Discount</span><strong>−{formatCurrency(discount)}</strong></div>
						<div><span>Round off</span><strong>{formatCurrency(totals.roundOff)}</strong></div>
						<div className="bill-grand-total"><span>Total due</span><strong>{formatCurrency(totals.finalTotal)}</strong></div>
						{paymentMethod === 'Credit' && <div><span>Balance due</span><strong>{formatCurrency(balanceAmount)}</strong></div>}
					</div>
					<button type="button" className="btn-primary checkout-button" disabled={!cart.length || createSale.isPending} onClick={submitSale}>
						{createSale.isPending ? 'Completing sale...' : `Complete sale · ${formatCurrency(totals.finalTotal)}`}
					</button>
				</section>
			</div>

			<section className="data-panel">
				<div className="panel-heading">
					<div><h2>Recent invoices</h2><p>Latest completed sales</p></div>
				</div>
				{recentSales.isError ? <p className="empty-state text-red-700">{apiErrorMessage(recentSales.error, 'Recent sales could not be loaded.')}</p> : (
					<div className="table-scroll">
						<table className="table-dense w-full min-w-[620px]">
							<thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Payment</th><th className="text-right">Total</th></tr></thead>
							<tbody>
								{recentSales.data?.items.map((invoice) => (
									<tr key={invoice._id}>
										<td className="font-mono text-xs font-semibold">{invoice.invoiceNumber}</td>
										<td>{invoice.customerName}</td>
										<td>{formatDate(invoice.createdAt)}</td>
										<td><span className="status-pill">{invoice.paymentMethod}</span></td>
										<td className="text-right font-semibold">{formatCurrency(invoice.grandTotal)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{lastInvoice && (
				createPortal(
					<InvoicePrint
						type="SALE"
						invoiceNumber={lastInvoice.invoiceNumber}
						partyName={lastInvoice.customerName}
						date={lastInvoice.createdAt}
						items={lastInvoice.items}
						subtotal={lastInvoice.subtotal}
						discount={lastInvoice.discount}
						gst={lastInvoice.gst}
						roundOff={lastInvoice.roundOff}
						grandTotal={lastInvoice.grandTotal}
						paymentMethod={lastInvoice.paymentMethod}
					/>,
					document.body
				)
			)}
		</div>
	);
}
