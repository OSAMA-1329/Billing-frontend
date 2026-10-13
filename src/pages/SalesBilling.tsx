// // import { useEffect, useMemo, useState } from 'react';
// // import { createPortal } from 'react-dom';
// // import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// // import toast from 'react-hot-toast';
// // import { apiErrorMessage, apiGet, apiPost } from '../api/client';
// // import { InvoicePrint } from '../components/InvoicePrint';
// // import type { Customer, Paginated, Product } from '../types';
// // import { formatCurrency, formatDate, round2 } from '../utils/format';
// // import { calculateUnitPriceAmount, convertFromBaseQuantity, convertQuantity, convertToBaseQuantity, getBaseUnit, getCompatibleUnits } from '../utils/units';

// // type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Credit';

// // interface CartLine {
// // 	product: Product;
// // 	quantity: number;
// // 	unit: string;
// // 	price: number;
// // }

// // interface SaleLinePayload {
// // 	productId: string;
// // 	productCode: string;
// // 	productName: string;
// // 	quantity: number;
// // 	unit?: string;
// // 	baseQuantity?: number;
// // 	baseUnit?: 'g' | 'ml' | 'pcs';
// // 	priceUnit?: string;
// // 	price: number;
// // 	retailPrice: number;
// // 	wholesalePrice: number;
// // 	discount: number;
// // 	gst: number;
// // 	total: number;
// // }

// // interface SaleInvoice {
// // 	_id: string;
// // 	invoiceNumber: string;
// // 	customerName: string;
// // 	createdAt: string;
// // 	items: SaleLinePayload[];
// // 	subtotal: number;
// // 	discount: number;
// // 	gst: number;
// // 	roundOff: number;
// // 	grandTotal: number;
// // 	paidAmount: number;
// // 	paymentMethod: PaymentMethod;
// // }

// // function getLineAmount(line: CartLine) {
// // 	return round2(calculateUnitPriceAmount(line.quantity, line.unit, line.price, line.product.unit));
// // }

// // function getProductBaseStock(product: Product) {
// // 	return product.stockBaseQuantity ?? convertToBaseQuantity(product.availableStock, product.unit);
// // }

// // export function SalesBillingPage() {
// // 	const queryClient = useQueryClient();
// // 	const [productSearch, setProductSearch] = useState('');
// // 	const [cart, setCart] = useState<CartLine[]>([]);
// // 	const [customerId, setCustomerId] = useState('');
// // 	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
// // 	const [creditPaid, setCreditPaid] = useState('0');
// // 	const [discountInput, setDiscountInput] = useState('0');
// // 	const [lastInvoice, setLastInvoice] = useState<SaleInvoice | null>(null);

// // 	useEffect(() => {
// // 		if (!lastInvoice) return;
// // 		const printTimer = window.setTimeout(() => window.print(), 50);
// // 		return () => window.clearTimeout(printTimer);
// // 	}, [lastInvoice]);

// // 	const products = useQuery({
// // 		queryKey: ['billing-products', productSearch],
// // 		queryFn: () => apiGet<Paginated<Product>>('/products', { page: 1, limit: 12, search: productSearch.trim() }),
// // 	});
// // 	const customers = useQuery({
// // 		queryKey: ['customers', 'billing'],
// // 		queryFn: () => apiGet<Paginated<Customer>>('/customers', { page: 1, limit: 250 }),
// // 	});
// // 	const recentSales = useQuery({
// // 		queryKey: ['sales', 'recent'],
// // 		queryFn: () => apiGet<Paginated<SaleInvoice>>('/sales', { page: 1, limit: 8 }),
// // 	});

// // 	const subtotal = useMemo(
// // 		() => round2(cart.reduce((sum, line) => sum + getLineAmount(line), 0)),
// // 		[cart]
// // 	);
// // 	const discount = Math.min(subtotal, Math.max(0, Number(discountInput) || 0));
// // 	const previewLines = useMemo(() => {
// // 		let allocatedDiscount = 0;
// // 		return cart.map((line, index) => {
// // 			const lineSubtotal = getLineAmount(line);
// // 			const remainingDiscount = round2(Math.max(0, discount - allocatedDiscount));
// // 			const lineDiscount = index === cart.length - 1
// // 				? remainingDiscount
// // 				: Math.min(remainingDiscount, round2(discount * lineSubtotal / (subtotal || 1)));
// // 			allocatedDiscount = round2(allocatedDiscount + lineDiscount);
// // 			return round2((lineSubtotal - lineDiscount) * line.product.gstPercent / 100);
// // 		});
// // 	}, [cart, discount, subtotal]);
// // 	const gst = round2(previewLines.reduce((sum, lineGst) => sum + lineGst, 0));
// // 	const totals = { roundOff: 0, finalTotal: round2(subtotal + gst - discount) };
// // 	const paidAmount = paymentMethod === 'Credit' ? Math.min(totals.finalTotal, Math.max(0, Number(creditPaid) || 0)) : totals.finalTotal;
// // 	const balanceAmount = round2(Math.max(0, totals.finalTotal - paidAmount));

// // 	const createSale = useMutation({
// // 		mutationFn: (payload: Record<string, unknown>) => apiPost<SaleInvoice>('/sales', payload),
// // 		onSuccess: async (invoice) => {
// // 			setLastInvoice(invoice);
// // 			setCart([]);
// // 			setDiscountInput('0');
// // 			setCreditPaid('0');
// // 			await Promise.all([
// // 				queryClient.invalidateQueries({ queryKey: ['sales'] }),
// // 				queryClient.invalidateQueries({ queryKey: ['products'] }),
// // 				queryClient.invalidateQueries({ queryKey: ['billing-products'] }),
// // 				queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
// // 			]);
// // 			toast.success(`Invoice ${invoice.invoiceNumber} created`);
// // 		},
// // 		onError: (error) => toast.error(apiErrorMessage(error, 'Sale could not be completed. Check stock and try again.')),
// // 	});

// // 	function addProduct(product: Product) {
// // 		if (getProductBaseStock(product) <= 0) {
// // 			toast.error('This product is out of stock.');
// // 			return;
// // 		}
// // 		setCart((current) => {
// // 			const existing = current.find((line) => line.product._id === product._id);
// // 			if (existing) {
// // 				const availableInUnit = convertFromBaseQuantity(getProductBaseStock(product), existing.unit);
// // 				if (existing.quantity + 1 > availableInUnit) {
// // 					toast.error('Quantity exceeds available stock.');
// // 					return current;
// // 				}
// // 				return current.map((line) => line.product._id === product._id ? { ...line, quantity: line.quantity + 1 } : line);
// // 			}
// // 			return [...current, { product, quantity: 1, unit: product.unit, price: product.retailPrice }];
// // 		});
// // 	}

// // 	function updateQuantity(productId: string, quantity: number) {
// // 		setCart((current) => current.map((line) => {
// // 			if (line.product._id !== productId) return line;
// // 			return { ...line, quantity };
// // 		}));
// // 	}

// // 	function submitSale() {
// // 		if (!cart.length) {
// // 			toast.error('Add at least one product to the bill.');
// // 			return;
// // 		}
// // 		if (paymentMethod === 'Credit' && !customerId) {
// // 			toast.error('Select a customer before recording a credit sale.');
// // 			return;
// // 		}

// // 		const items = cart.map(({ product, quantity, unit }) => ({ productId: product._id, quantity, unit }));

// // 		createSale.mutate({
// // 			customerId: customerId || undefined,
// // 			items,
// // 			discount,
// // 			paidAmount,
// // 			paymentMethod,
// // 			clientRequestId: crypto.randomUUID(),
// // 		});
// // 	}

// // 	return (
// // 		<div className="page-stack">
// // 			<header className="page-heading">
// // 				<div>
// // 					<p className="eyebrow">Point of sale</p>
// // 					<h1>Sales & billing</h1>
// // 					<p>Scan or search products, build the basket, and complete the bill.</p>
// // 				</div>
// // 				{lastInvoice && (
// // 					<button type="button" className="btn-secondary" onClick={() => window.print()}>
// // 						Print {lastInvoice.invoiceNumber}
// // 					</button>
// // 				)}
// // 			</header>

// // 			<div className="pos-grid">
// // 				<section className="data-panel pos-catalog">
// // 					<div className="panel-heading">
// // 						<div>
// // 							<h2>Find products</h2>
// // 							<p>Available stock is shown on each item.</p>
// // 						</div>
// // 						<span className="count-pill">{products.data?.total ?? 0} matches</span>
// // 					</div>
// // 					<label className="sr-only" htmlFor="billing-search">Search products</label>
// // 					<input
// // 						id="billing-search"
// // 						autoFocus
// // 						className="input"
// // 						value={productSearch}
// // 						onChange={(event) => setProductSearch(event.target.value)}
// // 						placeholder="Product name, item code, or barcode"
// // 					/>
// // 					<div className="product-pick-list">
// // 						{products.isPending ? <p className="empty-state">Loading products...</p> : null}
// // 						{products.isError ? <p className="empty-state text-red-700">{apiErrorMessage(products.error, 'Products could not be loaded.')}</p> : null}
// // 						{products.data?.items.map((product) => (
// // 							<button
// // 								key={product._id}
// // 								type="button"
// // 								className="product-pick"
// // 								disabled={product.availableStock <= 0}
// // 								onClick={() => addProduct(product)}
// // 							>
// // 								<span className="product-pick-copy">
// // 									<strong>{product.productName}</strong>
// // 									<span>{product.itemCode} · {product.availableStock} {product.unit} available</span>
// // 								</span>
// // 								<span className="product-pick-price">{formatCurrency(product.retailPrice)}</span>
// // 							</button>
// // 						))}
// // 						{!products.isPending && !products.isError && !products.data?.items.length && (
// // 							<p className="empty-state">No matching products.</p>
// // 						)}
// // 					</div>
// // 				</section>

// // 				<section className="data-panel pos-basket">
// // 					<div className="panel-heading">
// // 						<div>
// // 							<h2>Current bill</h2>
// // 							<p>{cart.length} {cart.length === 1 ? 'line item' : 'line items'}</p>
// // 						</div>
// // 						{cart.length > 0 && <button type="button" className="table-action table-action-danger" onClick={() => setCart([])}>Clear bill</button>}
// // 					</div>

// // 					{cart.length ? (
// // 						<div className="table-scroll cart-table-wrap">
// // 							<table className="table-dense w-full min-w-[610px]">
// // 								<thead>
// // 									<tr><th>Item</th><th>Qty</th><th>Unit</th><th>Rate</th><th className="text-right">Amount</th><th></th></tr>
// // 								</thead>
// // 								<tbody>
// // 									{cart.map((line) => {
// // 										const { product, quantity, price, unit } = line;
// // 										const availableInUnit = convertFromBaseQuantity(getProductBaseStock(product), unit);
// // 										return (
// // 											<tr key={product._id}>
// // 												<td><strong>{product.productName}</strong><span className="block text-xs text-slate-500">{product.itemCode} · {formatCurrency(price)} / {product.unit}</span></td>
// // 												{/* <td>
// // 												<input
// // 													aria-label={`Quantity for ${product.productName}`}
// // 													className="input qty-input"
// // 													type="number"
// // 													min={getBaseUnit(unit) === 'pcs' ? '1' : '0.001'}
// // 													max={availableInUnit}
// // 													step={getBaseUnit(unit) === 'pcs' ? '1' : unit === 'Kg' || unit === 'L' ? '0.001' : '1'}
// // 													value={quantity}
// // 													onChange={(event) => {
// // 														const next = Number(event.target.value);
// // 														if (next > 0 && next <= availableInUnit && (getBaseUnit(unit) !== 'pcs' || Number.isInteger(next))) updateQuantity(product._id, next);
// // 													}}
// // 												/>
// // 											</td> */}
// // 												<td>
// // 													<input
// // 														aria-label={`Quantity for ${product.productName}`}
// // 														className="input qty-input"
// // 														type="number"
// // 														min={getBaseUnit(unit) === "pcs" ? 1 : 0.001}
// // 														max={availableInUnit}
// // 														step={
// // 															getBaseUnit(unit) === "pcs"
// // 																? 1
// // 																: unit === "Kg" || unit === "L"
// // 																	? 0.001
// // 																	: 1
// // 														}
// // 														value={
// // 															quantityInputs[product._id] ??
// // 															String(quantity)
// // 														}
// // 														onChange={(event) => {
// // 															const value = event.target.value;

// // 															// Allow user to completely delete the value
// // 															setQuantityInputs((prev) => ({
// // 																...prev,
// // 																[product._id]: value,
// // 															}));

// // 															// Empty value → don't update quantity yet
// // 															if (value === "") {
// // 																return;
// // 															}

// // 															const next = Number(value);

// // 															// Allow decimals for Kg/L
// // 															if (
// // 																next > 0 &&
// // 																next <= availableInUnit &&
// // 																(
// // 																	getBaseUnit(unit) !== "pcs" ||
// // 																	Number.isInteger(next)
// // 																)
// // 															) {
// // 																updateQuantity(product._id, next);
// // 															}
// // 														}}
// // 														onBlur={(event) => {
// // 															const value = event.target.value;
// // 															const next = Number(value);

// // 															let validQuantity = next;

// // 															if (
// // 																!value ||
// // 																next <= 0 ||
// // 																next > availableInUnit ||
// // 																(
// // 																	getBaseUnit(unit) === "pcs" &&
// // 																	!Number.isInteger(next)
// // 																)
// // 															) {
// // 																validQuantity =
// // 																	getBaseUnit(unit) === "pcs"
// // 																		? 1
// // 																		: 0.001;
// // 															}

// // 															updateQuantity(product._id, validQuantity);

// // 															// Put formatted value back into input
// // 															setQuantityInputs((prev) => ({
// // 																...prev,
// // 																[product._id]: String(validQuantity),
// // 															}));
// // 														}}
// // 													/>
// // 												</td>
// // 												<td>
// // 													<select
// // 														aria-label={`Unit for ${product.productName}`}
// // 														className="input qty-input"
// // 														value={unit}
// // 														onChange={(event) => {
// // 															const nextUnit = event.target.value;
// // 															setCart((current) => current.map((item) => item.product._id === product._id
// // 																? { ...item, quantity: convertQuantity(item.quantity, item.unit, nextUnit), unit: nextUnit }
// // 																: item));
// // 														}}
// // 													>
// // 														{getCompatibleUnits(product.unit).map((option) => <option key={option} value={option}>{option}</option>)}
// // 													</select>
// // 												</td>
// // 												<td>
// // 													<input
// // 														aria-label={`Price for ${product.productName}`}
// // 														className="input price-input"
// // 														type="number"
// // 														min="0"
// // 														step="0.01"
// // 														value={price}
// // 														readOnly
// // 													/>
// // 												</td>
// // 												<td className="text-right font-semibold tabular-nums">{formatCurrency(getLineAmount(line))}</td>
// // 												<td><button type="button" className="table-action table-action-danger" aria-label={`Remove ${product.productName}`} onClick={() => setCart((current) => current.filter((line) => line.product._id !== product._id))}>Remove</button></td>
// // 											</tr>
// // 										);
// // 									})}
// // 								</tbody>
// // 							</table>
// // 						</div>
// // 					) : (
// // 						<div className="empty-state cart-empty"><strong>Your bill is empty</strong><p>Choose products from the catalog to begin.</p></div>
// // 					)}

// // 					<div className="checkout-fields">
// // 						<div>
// // 							<label className="label" htmlFor="sale-customer">Customer</label>
// // 							<select id="sale-customer" className="input" value={customerId} onChange={(event) => setCustomerId(event.target.value)} disabled={customers.isError}>
// // 								<option value="">Walk-in customer</option>
// // 								{customers.data?.items.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}{customer.phone ? ` · ${customer.phone}` : ''}</option>)}
// // 							</select>
// // 							{customers.isError && <p className="field-error">{apiErrorMessage(customers.error, 'Customer list could not be loaded.')}</p>}
// // 						</div>
// // 						<div>
// // 							<label className="label" htmlFor="sale-payment">Payment method</label>
// // 							<select id="sale-payment" className="input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
// // 								<option>Cash</option><option>Card</option><option>UPI</option><option>Credit</option>
// // 							</select>
// // 						</div>
// // 						<div>
// // 							<label className="label" htmlFor="sale-discount">Discount amount</label>
// // 							<input id="sale-discount" className="input" type="number" min="0" max={subtotal} step="0.01" value={discountInput} onChange={(event) => setDiscountInput(event.target.value)} />
// // 						</div>
// // 						{paymentMethod === 'Credit' && (
// // 							<div>
// // 								<label className="label" htmlFor="sale-paid">Amount received</label>
// // 								<input id="sale-paid" className="input" type="number" min="0" max={totals.finalTotal} step="0.01" value={creditPaid} onChange={(event) => setCreditPaid(event.target.value)} />
// // 							</div>
// // 						)}
// // 					</div>

// // 					<div className="bill-totals">
// // 						<div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
// // 						<div><span>GST</span><strong>{formatCurrency(gst)}</strong></div>
// // 						<div><span>Discount</span><strong>−{formatCurrency(discount)}</strong></div>
// // 						<div><span>Round off</span><strong>{formatCurrency(totals.roundOff)}</strong></div>
// // 						<div className="bill-grand-total"><span>Total due</span><strong>{formatCurrency(totals.finalTotal)}</strong></div>
// // 						{paymentMethod === 'Credit' && <div><span>Balance due</span><strong>{formatCurrency(balanceAmount)}</strong></div>}
// // 					</div>
// // 					<button type="button" className="btn-primary checkout-button" disabled={!cart.length || createSale.isPending} onClick={submitSale}>
// // 						{createSale.isPending ? 'Completing sale...' : `Complete sale · ${formatCurrency(totals.finalTotal)}`}
// // 					</button>
// // 				</section>
// // 			</div>

// // 			<section className="data-panel">
// // 				<div className="panel-heading">
// // 					<div><h2>Recent invoices</h2><p>Latest completed sales</p></div>
// // 				</div>
// // 				{recentSales.isError ? <p className="empty-state text-red-700">{apiErrorMessage(recentSales.error, 'Recent sales could not be loaded.')}</p> : (
// // 					<div className="table-scroll">
// // 						<table className="table-dense w-full min-w-[620px]">
// // 							<thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Payment</th><th className="text-right">Total</th></tr></thead>
// // 							<tbody>
// // 								{recentSales.data?.items.map((invoice) => (
// // 									<tr key={invoice._id}>
// // 										<td className="font-mono text-xs font-semibold">{invoice.invoiceNumber}</td>
// // 										<td>{invoice.customerName}</td>
// // 										<td>{formatDate(invoice.createdAt)}</td>
// // 										<td><span className="status-pill">{invoice.paymentMethod}</span></td>
// // 										<td className="text-right font-semibold">{formatCurrency(invoice.grandTotal)}</td>
// // 									</tr>
// // 								))}
// // 							</tbody>
// // 						</table>
// // 					</div>
// // 				)}
// // 			</section>

// // 			{lastInvoice && (
// // 				createPortal(
// // 					<InvoicePrint
// // 						type="SALE"
// // 						invoiceNumber={lastInvoice.invoiceNumber}
// // 						partyName={lastInvoice.customerName}
// // 						date={lastInvoice.createdAt}
// // 						items={lastInvoice.items}
// // 						subtotal={lastInvoice.subtotal}
// // 						discount={lastInvoice.discount}
// // 						gst={lastInvoice.gst}
// // 						roundOff={lastInvoice.roundOff}
// // 						grandTotal={lastInvoice.grandTotal}
// // 						paymentMethod={lastInvoice.paymentMethod}
// // 					/>,
// // 					document.body
// // 				)
// // 			)}
// // 		</div>
// // 	);
// // }
// import { useEffect, useMemo, useState } from 'react';
// import { createPortal } from 'react-dom';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import toast from 'react-hot-toast';

// import { apiErrorMessage, apiGet, apiPost } from '../api/client';
// import { InvoicePrint } from '../components/InvoicePrint';
// import type { Customer, Paginated, Product } from '../types';
// import { formatCurrency, formatDate, round2 } from '../utils/format';
// import {
// 	calculateUnitPriceAmount,
// 	convertFromBaseQuantity,
// 	convertQuantity,
// 	convertToBaseQuantity,
// 	getBaseUnit,
// 	getCompatibleUnits,
// } from '../utils/units';

// type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Credit';

// interface CartLine {
// 	product: Product;
// 	quantity: number;
// 	unit: string;
// 	price: number;
// }

// interface SaleLinePayload {
// 	productId: string;
// 	productCode: string;
// 	productName: string;
// 	quantity: number;
// 	unit?: string;
// 	baseQuantity?: number;
// 	baseUnit?: 'g' | 'ml' | 'pcs';
// 	priceUnit?: string;
// 	price: number;
// 	retailPrice: number;
// 	wholesalePrice: number;
// 	discount: number;
// 	gst: number;
// 	total: number;
// }

// interface SaleInvoice {
// 	_id: string;
// 	invoiceNumber: string;
// 	customerName: string;
// 	createdAt: string;
// 	items: SaleLinePayload[];
// 	subtotal: number;
// 	discount: number;
// 	gst: number;
// 	roundOff: number;
// 	grandTotal: number;
// 	paidAmount: number;
// 	paymentMethod: PaymentMethod;
// }

// function getLineAmount(line: CartLine) {
// 	return round2(
// 		calculateUnitPriceAmount(
// 			line.quantity,
// 			line.unit,
// 			line.price,
// 			line.product.unit
// 		)
// 	);
// }

// function getProductBaseStock(product: Product) {
// 	return (
// 		product.stockBaseQuantity ??
// 		convertToBaseQuantity(product.availableStock, product.unit)
// 	);
// }

// export function SalesBillingPage() {
// 	const queryClient = useQueryClient();

// 	const [productSearch, setProductSearch] = useState('');
// 	const [cart, setCart] = useState<CartLine[]>([]);

// 	// IMPORTANT:
// 	// Input values are strings so the user can type:
// 	// 1 -> "" -> 0 -> 0. -> 0.500
// 	const [quantityInputs, setQuantityInputs] = useState<
// 		Record<string, string>
// 	>({});

// 	const [customerId, setCustomerId] = useState('');
// 	const [paymentMethod, setPaymentMethod] =
// 		useState<PaymentMethod>('Cash');
// 	const [creditPaid, setCreditPaid] = useState('0');
// 	const [discountInput, setDiscountInput] = useState('0');
// 	const [lastInvoice, setLastInvoice] =
// 		useState<SaleInvoice | null>(null);

// 	useEffect(() => {
// 		if (!lastInvoice) return;

// 		const printTimer = window.setTimeout(() => {
// 			window.print();
// 		}, 50);

// 		return () => window.clearTimeout(printTimer);
// 	}, [lastInvoice]);

// 	const products = useQuery({
// 		queryKey: ['billing-products', productSearch],
// 		queryFn: () =>
// 			apiGet<Paginated<Product>>('/products', {
// 				page: 1,
// 				limit: 12,
// 				search: productSearch.trim(),
// 			}),
// 	});

// 	const customers = useQuery({
// 		queryKey: ['customers', 'billing'],
// 		queryFn: () =>
// 			apiGet<Paginated<Customer>>('/customers', {
// 				page: 1,
// 				limit: 250,
// 			}),
// 	});

// 	const recentSales = useQuery({
// 		queryKey: ['sales', 'recent'],
// 		queryFn: () =>
// 			apiGet<Paginated<SaleInvoice>>('/sales', {
// 				page: 1,
// 				limit: 8,
// 			}),
// 	});

// 	const subtotal = useMemo(
// 		() =>
// 			round2(
// 				cart.reduce(
// 					(sum, line) => sum + getLineAmount(line),
// 					0
// 				)
// 			),
// 		[cart]
// 	);

// 	const discount = Math.min(
// 		subtotal,
// 		Math.max(0, Number(discountInput) || 0)
// 	);

// 	const previewLines = useMemo(() => {
// 		let allocatedDiscount = 0;

// 		return cart.map((line, index) => {
// 			const lineSubtotal = getLineAmount(line);

// 			const remainingDiscount = round2(
// 				Math.max(0, discount - allocatedDiscount)
// 			);

// 			const lineDiscount =
// 				index === cart.length - 1
// 					? remainingDiscount
// 					: Math.min(
// 						remainingDiscount,
// 						round2(
// 							(discount * lineSubtotal) /
// 							(subtotal || 1)
// 						)
// 					);

// 			allocatedDiscount = round2(
// 				allocatedDiscount + lineDiscount
// 			);

// 			return round2(
// 				(lineSubtotal - lineDiscount) *
// 				line.product.gstPercent /
// 				100
// 			);
// 		});
// 	}, [cart, discount, subtotal]);

// 	const gst = round2(
// 		previewLines.reduce(
// 			(sum, lineGst) => sum + lineGst,
// 			0
// 		)
// 	);

// 	const totals = {
// 		roundOff: 0,
// 		finalTotal: round2(
// 			subtotal + gst - discount
// 		),
// 	};

// 	const paidAmount =
// 		paymentMethod === 'Credit'
// 			? Math.min(
// 				totals.finalTotal,
// 				Math.max(0, Number(creditPaid) || 0)
// 			)
// 			: totals.finalTotal;

// 	const balanceAmount = round2(
// 		Math.max(
// 			0,
// 			totals.finalTotal - paidAmount
// 		)
// 	);

// 	const createSale = useMutation({
// 		mutationFn: (payload: Record<string, unknown>) =>
// 			apiPost<SaleInvoice>('/sales', payload),

// 		onSuccess: async (invoice) => {
// 			setLastInvoice(invoice);

// 			setCart([]);
// 			setQuantityInputs({});
// 			setDiscountInput('0');
// 			setCreditPaid('0');

// 			await Promise.all([
// 				queryClient.invalidateQueries({
// 					queryKey: ['sales'],
// 				}),
// 				queryClient.invalidateQueries({
// 					queryKey: ['products'],
// 				}),
// 				queryClient.invalidateQueries({
// 					queryKey: ['billing-products'],
// 				}),
// 				queryClient.invalidateQueries({
// 					queryKey: ['dashboard'],
// 				}),
// 			]);

// 			toast.success(
// 				`Invoice ${invoice.invoiceNumber} created`
// 			);
// 		},

// 		onError: (error) =>
// 			toast.error(
// 				apiErrorMessage(
// 					error,
// 					'Sale could not be completed. Check stock and try again.'
// 				)
// 			),
// 	});

// 	function addProduct(product: Product) {
// 		if (getProductBaseStock(product) <= 0) {
// 			toast.error('This product is out of stock.');
// 			return;
// 		}

// 		setCart((current) => {
// 			const existing = current.find(
// 				(line) =>
// 					line.product._id === product._id
// 			);

// 			if (existing) {
// 				const availableInUnit =
// 					convertFromBaseQuantity(
// 						getProductBaseStock(product),
// 						existing.unit
// 					);

// 				const nextQuantity =
// 					existing.quantity + 1;

// 				if (nextQuantity > availableInUnit) {
// 					toast.error(
// 						'Quantity exceeds available stock.'
// 					);
// 					return current;
// 				}

// 				setQuantityInputs((prev) => ({
// 					...prev,
// 					[product._id]:
// 						String(nextQuantity),
// 				}));

// 				return current.map((line) =>
// 					line.product._id === product._id
// 						? {
// 							...line,
// 							quantity: nextQuantity,
// 						}
// 						: line
// 				);
// 			}

// 			setQuantityInputs((prev) => ({
// 				...prev,
// 				[product._id]: '1',
// 			}));

// 			return [
// 				...current,
// 				{
// 					product,
// 					quantity: 1,
// 					unit: product.unit,
// 					price: product.retailPrice,
// 				},
// 			];
// 		});
// 	}

// 	function updateQuantity(
// 		productId: string,
// 		quantity: number
// 	) {
// 		setCart((current) =>
// 			current.map((line) =>
// 				line.product._id === productId
// 					? {
// 						...line,
// 						quantity,
// 					}
// 					: line
// 			)
// 		);
// 	}

// 	function updateQuantityInput(
// 		productId: string,
// 		value: string
// 	) {
// 		setQuantityInputs((prev) => ({
// 			...prev,
// 			[productId]: value,
// 		}));
// 	}

// 	function commitQuantity(
// 		productId: string,
// 		rawValue: string,
// 		availableInUnit: number,
// 		unit: string
// 	) {
// 		const baseUnit = getBaseUnit(unit);

// 		const value = rawValue.trim();
// 		const next = Number(value);

// 		let finalQuantity: number;

// 		// Empty / invalid
// 		if (
// 			value === '' ||
// 			!Number.isFinite(next) ||
// 			next <= 0
// 		) {
// 			finalQuantity =
// 				baseUnit === 'pcs'
// 					? 1
// 					: 0.001;
// 		}

// 		// Greater than stock
// 		else if (next > availableInUnit) {
// 			finalQuantity = availableInUnit;
// 		}

// 		// Pieces must be integer
// 		else if (
// 			baseUnit === 'pcs' &&
// 			!Number.isInteger(next)
// 		) {
// 			finalQuantity = 1;
// 		}

// 		// Valid Kg/L/other quantity
// 		else {
// 			finalQuantity = next;
// 		}

// 		updateQuantity(
// 			productId,
// 			finalQuantity
// 		);

// 		setQuantityInputs((prev) => ({
// 			...prev,
// 			[productId]:
// 				String(finalQuantity),
// 		}));
// 	}

// 	function handleUnitChange(
// 		productId: string,
// 		nextUnit: string
// 	) {
// 		setCart((current) =>
// 			current.map((item) => {
// 				if (
// 					item.product._id !== productId
// 				) {
// 					return item;
// 				}

// 				const nextQuantity =
// 					convertQuantity(
// 						item.quantity,
// 						item.unit,
// 						nextUnit
// 					);

// 				setQuantityInputs((prev) => ({
// 					...prev,
// 					[productId]:
// 						String(nextQuantity),
// 				}));

// 				return {
// 					...item,
// 					quantity: nextQuantity,
// 					unit: nextUnit,
// 				};
// 			})
// 		);
// 	}

// 	function removeProduct(
// 		productId: string
// 	) {
// 		setCart((current) =>
// 			current.filter(
// 				(line) =>
// 					line.product._id !== productId
// 			)
// 		);

// 		setQuantityInputs((prev) => {
// 			const next = { ...prev };

// 			delete next[productId];

// 			return next;
// 		});
// 	}

// 	function submitSale() {
// 		if (!cart.length) {
// 			toast.error(
// 				'Add at least one product to the bill.'
// 			);
// 			return;
// 		}

// 		// Final validation before sending to backend
// 		for (const line of cart) {
// 			const availableInUnit =
// 				convertFromBaseQuantity(
// 					getProductBaseStock(
// 						line.product
// 					),
// 					line.unit
// 				);

// 			const baseUnit =
// 				getBaseUnit(line.unit);

// 			if (
// 				!Number.isFinite(line.quantity) ||
// 				line.quantity <= 0
// 			) {
// 				toast.error(
// 					`Invalid quantity for ${line.product.productName}.`
// 				);
// 				return;
// 			}

// 			if (
// 				line.quantity >
// 				availableInUnit
// 			) {
// 				toast.error(
// 					`Quantity exceeds stock for ${line.product.productName}.`
// 				);
// 				return;
// 			}

// 			if (
// 				baseUnit === 'pcs' &&
// 				!Number.isInteger(
// 					line.quantity
// 				)
// 			) {
// 				toast.error(
// 					`${line.product.productName} must have a whole-piece quantity.`
// 				);
// 				return;
// 			}
// 		}

// 		if (
// 			paymentMethod === 'Credit' &&
// 			!customerId
// 		) {
// 			toast.error(
// 				'Select a customer before recording a credit sale.'
// 			);
// 			return;
// 		}

// 		const items = cart.map(
// 			({ product, quantity, unit }) => ({
// 				productId: product._id,
// 				quantity,
// 				unit,
// 			})
// 		);

// 		createSale.mutate({
// 			customerId:
// 				customerId || undefined,
// 			items,
// 			discount,
// 			paidAmount,
// 			paymentMethod,
// 			clientRequestId:
// 				crypto.randomUUID(),
// 		});
// 	}

// 	return (
// 		<div className="page-stack">
// 			<header className="page-heading">
// 				<div>
// 					<p className="eyebrow">
// 						Point of sale
// 					</p>

// 					<h1>Sales & billing</h1>

// 					<p>
// 						Scan or search products, build
// 						the basket, and complete the
// 						bill.
// 					</p>
// 				</div>

// 				{lastInvoice && (
// 					<button
// 						type="button"
// 						className="btn-secondary"
// 						onClick={() =>
// 							window.print()
// 						}
// 					>
// 						Print {lastInvoice.invoiceNumber}
// 					</button>
// 				)}
// 			</header>

// 			<div className="pos-grid">
// 				{/* PRODUCTS */}
// 				<section className="data-panel pos-catalog">
// 					<div className="panel-heading">
// 						<div>
// 							<h2>Find products</h2>
// 							<p>
// 								Available stock is shown on
// 								each item.
// 							</p>
// 						</div>

// 						<span className="count-pill">
// 							{products.data?.total ?? 0}{' '}
// 							matches
// 						</span>
// 					</div>

// 					<label
// 						className="sr-only"
// 						htmlFor="billing-search"
// 					>
// 						Search products
// 					</label>

// 					<input
// 						id="billing-search"
// 						autoFocus
// 						className="input"
// 						value={productSearch}
// 						onChange={(event) =>
// 							setProductSearch(
// 								event.target.value
// 							)
// 						}
// 						placeholder="Product name, item code, or barcode"
// 					/>

// 					<div className="product-pick-list">
// 						{products.isPending ? (
// 							<p className="empty-state">
// 								Loading products...
// 							</p>
// 						) : null}

// 						{products.isError ? (
// 							<p className="empty-state text-red-700">
// 								{apiErrorMessage(
// 									products.error,
// 									'Products could not be loaded.'
// 								)}
// 							</p>
// 						) : null}

// 						{products.data?.items.map(
// 							(product) => (
// 								<button
// 									key={product._id}
// 									type="button"
// 									className="product-pick"
// 									disabled={
// 										product.availableStock <= 0
// 									}
// 									onClick={() =>
// 										addProduct(product)
// 									}
// 								>
// 									<span className="product-pick-copy">
// 										<strong>
// 											{product.productName}
// 										</strong>

// 										<span>
// 											{product.itemCode} ·{' '}
// 											{product.availableStock}{' '}
// 											{product.unit}{' '}
// 											available
// 										</span>
// 									</span>

// 									<span className="product-pick-price">
// 										{formatCurrency(
// 											product.retailPrice
// 										)}
// 									</span>
// 								</button>
// 							)
// 						)}

// 						{!products.isPending &&
// 							!products.isError &&
// 							!products.data?.items.length && (
// 								<p className="empty-state">
// 									No matching products.
// 								</p>
// 							)}
// 					</div>
// 				</section>

// 				{/* CART */}
// 				<section className="data-panel pos-basket">
// 					<div className="panel-heading">
// 						<div>
// 							<h2>Current bill</h2>

// 							<p>
// 								{cart.length}{' '}
// 								{cart.length === 1
// 									? 'line item'
// 									: 'line items'}
// 							</p>
// 						</div>

// 						{cart.length > 0 && (
// 							<button
// 								type="button"
// 								className="table-action table-action-danger"
// 								onClick={() => {
// 									setCart([]);
// 									setQuantityInputs({});
// 								}}
// 							>
// 								Clear bill
// 							</button>
// 						)}
// 					</div>

// 					{cart.length ? (
// 						<div className="table-scroll cart-table-wrap">
// 							<table className="table-dense w-full min-w-[610px]">
// 								<thead>
// 									<tr>
// 										<th>Item</th>
// 										<th>Qty</th>
// 										<th>Unit</th>
// 										<th>Rate</th>
// 										<th className="text-right">
// 											Amount
// 										</th>
// 										<th />
// 									</tr>
// 								</thead>

// 								<tbody>
// 									{cart.map((line) => {
// 										const {
// 											product,
// 											quantity,
// 											price,
// 											unit,
// 										} = line;

// 										const availableInUnit =
// 											convertFromBaseQuantity(
// 												getProductBaseStock(
// 													product
// 												),
// 												unit
// 											);

// 										const baseUnit =
// 											getBaseUnit(unit);

// 										return (
// 											<tr
// 												key={product._id}
// 											>
// 												<td>
// 													<strong>
// 														{product.productName}
// 													</strong>

// 													<span className="block text-xs text-slate-500">
// 														{product.itemCode} ·{' '}
// 														{formatCurrency(
// 															price
// 														)}{' '}
// 														/ {product.unit}
// 													</span>
// 												</td>

// 												{/* ========================= */}
// 												{/* QUANTITY INPUT             */}
// 												{/* ========================= */}
// 												<td>
// 													<input
// 														aria-label={`Quantity for ${product.productName}`}
// 														className="input qty-input"
// 														type="number"
// 														min={
// 															baseUnit === 'pcs'
// 																? 1
// 																: 0.001
// 														}
// 														max={
// 															availableInUnit
// 														}
// 														step={
// 															baseUnit === 'pcs'
// 																? 1
// 																: unit === 'Kg' ||
// 																	unit === 'L'
// 																	? 0.001
// 																	: 1
// 														}
// 														value={
// 															quantityInputs[
// 															product._id
// 															] ??
// 															String(quantity)
// 														}
// 														onChange={(
// 															event
// 														) => {
// 															const value =
// 																event.target
// 																	.value;

// 															// IMPORTANT:
// 															// Allow empty value.
// 															// User can now delete "1".
// 															updateQuantityInput(
// 																product._id,
// 																value
// 															);

// 															// Don't update cart
// 															// while completely empty.
// 															if (
// 																value === ''
// 															) {
// 																return;
// 															}

// 															const next =
// 																Number(value);

// 															if (
// 																!Number.isFinite(
// 																	next
// 																)
// 															) {
// 																return;
// 															}

// 															// Don't exceed stock.
// 															if (
// 																next >
// 																availableInUnit
// 															) {
// 																return;
// 															}

// 															// Pieces only accept integers.
// 															if (
// 																baseUnit ===
// 																'pcs' &&
// 																!Number.isInteger(
// 																	next
// 																)
// 															) {
// 																return;
// 															}

// 															// Kg/L/grams/ml can
// 															// use decimal values.
// 															if (
// 																next > 0
// 															) {
// 																updateQuantity(
// 																	product._id,
// 																	next
// 																);
// 															}
// 														}}
// 														onBlur={(
// 															event
// 														) => {
// 															commitQuantity(
// 																product._id,
// 																event.target
// 																	.value,
// 																availableInUnit,
// 																unit
// 															);
// 														}}
// 													/>
// 												</td>

// 												{/* UNIT */}
// 												<td>
// 													<select
// 														aria-label={`Unit for ${product.productName}`}
// 														className="input qty-input"
// 														value={unit}
// 														onChange={(
// 															event
// 														) =>
// 															handleUnitChange(
// 																product._id,
// 																event.target
// 																	.value
// 															)
// 														}
// 													>
// 														{getCompatibleUnits(
// 															product.unit
// 														).map(
// 															(option) => (
// 																<option
// 																	key={option}
// 																	value={option}
// 																>
// 																	{option}
// 																</option>
// 															)
// 														)}
// 													</select>
// 												</td>

// 												{/* PRICE */}
// 												<td>
// 													<input
// 														aria-label={`Price for ${product.productName}`}
// 														className="input price-input"
// 														type="number"
// 														min="0"
// 														step="0.01"
// 														value={price}
// 														readOnly
// 													/>
// 												</td>

// 												{/* AMOUNT */}
// 												<td className="text-right font-semibold tabular-nums">
// 													{formatCurrency(
// 														getLineAmount(
// 															line
// 														)
// 													)}
// 												</td>

// 												{/* REMOVE */}
// 												<td>
// 													<button
// 														type="button"
// 														className="table-action table-action-danger"
// 														aria-label={`Remove ${product.productName}`}
// 														onClick={() =>
// 															removeProduct(
// 																product._id
// 															)
// 														}
// 													>
// 														Remove
// 													</button>
// 												</td>
// 											</tr>
// 										);
// 									})}
// 								</tbody>
// 							</table>
// 						</div>
// 					) : (
// 						<div className="empty-state cart-empty">
// 							<strong>
// 								Your bill is empty
// 							</strong>

// 							<p>
// 								Choose products from the
// 								catalog to begin.
// 							</p>
// 						</div>
// 					)}

// 					{/* CHECKOUT */}
// 					<div className="checkout-fields">
// 						<div>
// 							<label
// 								className="label"
// 								htmlFor="sale-customer"
// 							>
// 								Customer
// 							</label>

// 							<select
// 								id="sale-customer"
// 								className="input"
// 								value={customerId}
// 								onChange={(event) =>
// 									setCustomerId(
// 										event.target.value
// 									)
// 								}
// 								disabled={customers.isError}
// 							>
// 								<option value="">
// 									Walk-in customer
// 								</option>

// 								{customers.data?.items.map(
// 									(customer) => (
// 										<option
// 											key={customer._id}
// 											value={customer._id}
// 										>
// 											{customer.name}
// 											{customer.phone
// 												? ` · ${customer.phone}`
// 												: ''}
// 										</option>
// 									)
// 								)}
// 							</select>

// 							{customers.isError && (
// 								<p className="field-error">
// 									{apiErrorMessage(
// 										customers.error,
// 										'Customer list could not be loaded.'
// 									)}
// 								</p>
// 							)}
// 						</div>

// 						<div>
// 							<label
// 								className="label"
// 								htmlFor="sale-payment"
// 							>
// 								Payment method
// 							</label>

// 							<select
// 								id="sale-payment"
// 								className="input"
// 								value={paymentMethod}
// 								onChange={(event) =>
// 									setPaymentMethod(
// 										event.target
// 											.value as PaymentMethod
// 									)
// 								}
// 							>
// 								<option>Cash</option>
// 								<option>Card</option>
// 								<option>UPI</option>
// 								<option>Credit</option>
// 							</select>
// 						</div>

// 						<div>
// 							<label
// 								className="label"
// 								htmlFor="sale-discount"
// 							>
// 								Discount amount
// 							</label>

// 							<input
// 								id="sale-discount"
// 								className="input"
// 								type="number"
// 								min="0"
// 								max={subtotal}
// 								step="0.01"
// 								value={discountInput}
// 								onChange={(event) =>
// 									setDiscountInput(
// 										event.target.value
// 									)
// 								}
// 							/>
// 						</div>

// 						{paymentMethod === 'Credit' && (
// 							<div>
// 								<label
// 									className="label"
// 									htmlFor="sale-paid"
// 								>
// 									Amount received
// 								</label>

// 								<input
// 									id="sale-paid"
// 									className="input"
// 									type="number"
// 									min="0"
// 									max={totals.finalTotal}
// 									step="0.01"
// 									value={creditPaid}
// 									onChange={(event) =>
// 										setCreditPaid(
// 											event.target.value
// 										)
// 									}
// 								/>
// 							</div>
// 						)}
// 					</div>

// 					{/* TOTALS */}
// 					<div className="bill-totals">
// 						<div>
// 							<span>Subtotal</span>
// 							<strong>
// 								{formatCurrency(subtotal)}
// 							</strong>
// 						</div>

// 						<div>
// 							<span>GST</span>
// 							<strong>
// 								{formatCurrency(gst)}
// 							</strong>
// 						</div>

// 						<div>
// 							<span>Discount</span>
// 							<strong>
// 								−{formatCurrency(discount)}
// 							</strong>
// 						</div>

// 						<div>
// 							<span>Round off</span>
// 							<strong>
// 								{formatCurrency(
// 									totals.roundOff
// 								)}
// 							</strong>
// 						</div>

// 						<div className="bill-grand-total">
// 							<span>Total due</span>
// 							<strong>
// 								{formatCurrency(
// 									totals.finalTotal
// 								)}
// 							</strong>
// 						</div>

// 						{paymentMethod === 'Credit' && (
// 							<div>
// 								<span>Balance due</span>
// 								<strong>
// 									{formatCurrency(
// 										balanceAmount
// 									)}
// 								</strong>
// 							</div>
// 						)}
// 					</div>

// 					<button
// 						type="button"
// 						className="btn-primary checkout-button"
// 						disabled={
// 							!cart.length ||
// 							createSale.isPending
// 						}
// 						onClick={submitSale}
// 					>
// 						{createSale.isPending
// 							? 'Completing sale...'
// 							: `Complete sale · ${formatCurrency(
// 								totals.finalTotal
// 							)}`}
// 					</button>
// 				</section>
// 			</div>

// 			{/* RECENT INVOICES */}
// 			<section className="data-panel">
// 				<div className="panel-heading">
// 					<div>
// 						<h2>Recent invoices</h2>
// 						<p>
// 							Latest completed sales
// 						</p>
// 					</div>
// 				</div>

// 				{recentSales.isError ? (
// 					<p className="empty-state text-red-700">
// 						{apiErrorMessage(
// 							recentSales.error,
// 							'Recent sales could not be loaded.'
// 						)}
// 					</p>
// 				) : (
// 					<div className="table-scroll">
// 						<table className="table-dense w-full min-w-[620px]">
// 							<thead>
// 								<tr>
// 									<th>Invoice</th>
// 									<th>Customer</th>
// 									<th>Date</th>
// 									<th>Payment</th>
// 									<th className="text-right">
// 										Total
// 									</th>
// 								</tr>
// 							</thead>

// 							<tbody>
// 								{recentSales.data?.items.map(
// 									(invoice) => (
// 										<tr
// 											key={invoice._id}
// 										>
// 											<td className="font-mono text-xs font-semibold">
// 												{
// 													invoice.invoiceNumber
// 												}
// 											</td>

// 											<td>
// 												{
// 													invoice.customerName
// 												}
// 											</td>

// 											<td>
// 												{formatDate(
// 													invoice.createdAt
// 												)}
// 											</td>

// 											<td>
// 												<span className="status-pill">
// 													{
// 														invoice.paymentMethod
// 													}
// 												</span>
// 											</td>

// 											<td className="text-right font-semibold">
// 												{formatCurrency(
// 													invoice.grandTotal
// 												)}
// 											</td>
// 										</tr>
// 									)
// 								)}
// 							</tbody>
// 						</table>
// 					</div>
// 				)}
// 			</section>

// 			{/* PRINT */}
// 			{lastInvoice &&
// 				createPortal(
// 					<InvoicePrint
// 						type="SALE"
// 						invoiceNumber={
// 							lastInvoice.invoiceNumber
// 						}
// 						partyName={
// 							lastInvoice.customerName
// 						}
// 						date={lastInvoice.createdAt}
// 						items={lastInvoice.items}
// 						subtotal={
// 							lastInvoice.subtotal
// 						}
// 						discount={
// 							lastInvoice.discount
// 						}
// 						gst={lastInvoice.gst}
// 						roundOff={
// 							lastInvoice.roundOff
// 						}
// 						grandTotal={
// 							lastInvoice.grandTotal
// 						}
// 						paymentMethod={
// 							lastInvoice.paymentMethod
// 						}
// 						thermal={true}
// 					/>,
// 					document.body
// 				)}
// 		</div>
// 	);
// }



import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
	apiErrorMessage,
	apiGet,
	apiPost,
} from '../api/client';

import { InvoicePrint } from '../components/InvoicePrint';

import type {
	Customer,
	Paginated,
	Product,
} from '../types';

import {
	formatCurrency,
	formatDate,
	round2,
} from '../utils/format';

import {
	calculateUnitPriceAmount,
	convertFromBaseQuantity,
	convertQuantity,
	convertToBaseQuantity,
	getBaseUnit,
	getCompatibleUnits,
} from '../utils/units';

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
	customerId?: string;
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

interface RebillLocationState {
	rebill?: SaleInvoice;
}

function getLineAmount(line: CartLine) {
	return round2(
		calculateUnitPriceAmount(
			line.quantity,
			line.unit,
			line.price,
			line.product.unit,
		),
	);
}

function getProductBaseStock(product: Product) {
	return (
		product.stockBaseQuantity ??
		convertToBaseQuantity(
			product.availableStock,
			product.unit,
		)
	);
}

export function SalesBillingPage() {
	const queryClient = useQueryClient();
	const location = useLocation();
	const navigate = useNavigate();

	const navigationState =
		location.state as RebillLocationState | null;

	const rebillInvoice = navigationState?.rebill;

	const processedRebillId = useRef<string | null>(null);

	const [productSearch, setProductSearch] = useState('');
	const [cart, setCart] = useState<CartLine[]>([]);

	const [quantityInputs, setQuantityInputs] =
		useState<Record<string, string>>({});

	const [customerId, setCustomerId] = useState('');
	const [paymentMethod, setPaymentMethod] =
		useState<PaymentMethod>('Cash');

	const [creditPaid, setCreditPaid] = useState('0');
	const [discountInput, setDiscountInput] = useState('0');

	const [lastInvoice, setLastInvoice] =
		useState<SaleInvoice | null>(null);

	const [rebillingInvoiceNumber, setRebillingInvoiceNumber] =
		useState<string | null>(null);

	const [rebillLoading, setRebillLoading] = useState(false);

	useEffect(() => {
		if (!lastInvoice) return;

		const printTimer = window.setTimeout(() => {
			window.print();
		}, 50);

		return () => window.clearTimeout(printTimer);
	}, [lastInvoice]);

	const products = useQuery({
		queryKey: ['billing-products', productSearch],
		queryFn: () =>
			apiGet<Paginated<Product>>('/products', {
				page: 1,
				limit: 12,
				search: productSearch.trim(),
			}),
	});

	const customers = useQuery({
		queryKey: ['customers', 'billing'],
		queryFn: () =>
			apiGet<Paginated<Customer>>('/customers', {
				page: 1,
				limit: 250,
			}),
	});

	const recentSales = useQuery({
		queryKey: ['sales', 'recent'],
		queryFn: () =>
			apiGet<Paginated<SaleInvoice>>('/sales', {
				page: 1,
				limit: 8,
			}),
	});

	/*
	 * REBILL:
	 * Load every original product by ID so that products not
	 * currently in the first 12 search results are also included.
	 *
	 * The original invoice is never updated by this effect.
	 */
	useEffect(() => {
		if (!rebillInvoice?._id) return;

		if (processedRebillId.current === rebillInvoice._id) {
			return;
		}

		let cancelled = false;

		async function loadOriginalInvoice() {
			setRebillLoading(true);

			try {
				const originalItems = rebillInvoice?.items ?? [];

				if (!rebillInvoice || originalItems.length === 0) {
					toast.error('The original invoice has no items.');
					return;
				}

				const loadedProducts = await Promise.all(
					originalItems.map(async (item) => {
						if (!item.productId) {
							throw new Error(
								`Product ID is missing for ${item.productName}.`,
							);
						}

						return apiGet<Product>(
							`/products/${item.productId}`,
						);
					}),
				);

				if (cancelled) return;

				const newCart: CartLine[] = originalItems.map(
					(item, index) => {
						const product = loadedProducts[index];

						if (!product?._id) {
							throw new Error(
								`Could not load product: ${item.productName}.`,
							);
						}

						return {
							product,
							quantity: Number(item.quantity),
							unit: item.unit || product.unit,
							price: Number(
								item.price ?? product.retailPrice,
							),
						};
					},
				);

				setCart(newCart);

				setQuantityInputs(
					Object.fromEntries(
						newCart.map((line) => [
							line.product._id,
							String(line.quantity),
						]),
					),
				);

				setDiscountInput(
					String(rebillInvoice.discount ?? 0),
				);

				// Start a new payment transaction for the new bill.
				setPaymentMethod('Cash');
				setCreditPaid('0');

				setCustomerId(
					rebillInvoice.customerId &&
						customers.data?.items.some(
							(customer) =>
								customer._id === rebillInvoice.customerId,
						)
						? rebillInvoice.customerId
						: '',
				);

				setLastInvoice(null);
				setRebillingInvoiceNumber(
					rebillInvoice.invoiceNumber,
				);

				processedRebillId.current = rebillInvoice._id;

				toast.success(
					`Invoice ${rebillInvoice.invoiceNumber} loaded into Current Bill.`,
				);

				// Consume the navigation state to prevent reloading
				// the same invoice on a later render.
				navigate(location.pathname, {
					replace: true,
					state: null,
				});
			} catch (error) {
				if (!cancelled) {
					toast.error(
						apiErrorMessage(
							error,
							'Could not load the original invoice.',
						),
					);
				}
			} finally {
				if (!cancelled) {
					setRebillLoading(false);
				}
			}
		}

		void loadOriginalInvoice();

		return () => {
			cancelled = true;
		};
	}, [
		rebillInvoice,
		customers.data,
		location.pathname,
		navigate,
	]);

	const subtotal = useMemo(
		() =>
			round2(
				cart.reduce(
					(sum, line) => sum + getLineAmount(line),
					0,
				),
			),
		[cart],
	);

	const discount = Math.min(
		subtotal,
		Math.max(0, Number(discountInput) || 0),
	);

	const previewLines = useMemo(() => {
		let allocatedDiscount = 0;

		return cart.map((line, index) => {
			const lineSubtotal = getLineAmount(line);

			const remainingDiscount = round2(
				Math.max(0, discount - allocatedDiscount),
			);

			const lineDiscount =
				index === cart.length - 1
					? remainingDiscount
					: Math.min(
						remainingDiscount,
						round2(
							(discount * lineSubtotal) /
							(subtotal || 1),
						),
					);

			allocatedDiscount = round2(
				allocatedDiscount + lineDiscount,
			);

			return round2(
				((lineSubtotal - lineDiscount) *
					line.product.gstPercent) /
				100,
			);
		});
	}, [cart, discount, subtotal]);

	const gst = round2(
		previewLines.reduce(
			(sum, lineGst) => sum + lineGst,
			0,
		),
	);

	const totals = {
		roundOff: 0,
		finalTotal: round2(subtotal + gst - discount),
	};

	const paidAmount =
		paymentMethod === 'Credit'
			? Math.min(
				totals.finalTotal,
				Math.max(0, Number(creditPaid) || 0),
			)
			: totals.finalTotal;

	const balanceAmount = round2(
		Math.max(0, totals.finalTotal - paidAmount),
	);

	const createSale = useMutation({
		mutationFn: (payload: Record<string, unknown>) =>
			apiPost<SaleInvoice>('/sales', payload),

		onSuccess: async (invoice) => {
			setLastInvoice(invoice);

			setCart([]);
			setQuantityInputs({});
			setCustomerId('');
			setDiscountInput('0');
			setCreditPaid('0');
			setPaymentMethod('Cash');
			setRebillingInvoiceNumber(null);

			processedRebillId.current = null;

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ['sales'],
				}),
				queryClient.invalidateQueries({
					queryKey: ['products'],
				}),
				queryClient.invalidateQueries({
					queryKey: ['billing-products'],
				}),
				queryClient.invalidateQueries({
					queryKey: ['dashboard'],
				}),
				queryClient.invalidateQueries({
					queryKey: ['report'],
				}),
			]);

			toast.success(
				`New invoice ${invoice.invoiceNumber} created.`,
			);
		},

		onError: (error) => {
			toast.error(
				apiErrorMessage(
					error,
					'Sale could not be completed. Check stock and try again.',
				),
			);
		},
	});

	function addProduct(product: Product) {
		if (getProductBaseStock(product) <= 0) {
			toast.error('This product is out of stock.');
			return;
		}

		setCart((current) => {
			const existing = current.find(
				(line) => line.product._id === product._id,
			);

			if (existing) {
				const availableInUnit = convertFromBaseQuantity(
					getProductBaseStock(product),
					existing.unit,
				);

				const nextQuantity = existing.quantity + 1;

				if (nextQuantity > availableInUnit) {
					toast.error('Quantity exceeds available stock.');
					return current;
				}

				setQuantityInputs((previous) => ({
					...previous,
					[product._id]: String(nextQuantity),
				}));

				return current.map((line) =>
					line.product._id === product._id
						? { ...line, quantity: nextQuantity }
						: line,
				);
			}

			setQuantityInputs((previous) => ({
				...previous,
				[product._id]: '1',
			}));

			return [
				...current,
				{
					product,
					quantity: 1,
					unit: product.unit,
					price: product.retailPrice,
				},
			];
		});
	}

	function updateQuantity(
		productId: string,
		quantity: number,
	) {
		setCart((current) =>
			current.map((line) =>
				line.product._id === productId
					? { ...line, quantity }
					: line,
			),
		);
	}

	function removeProduct(productId: string) {
		setCart((current) =>
			current.filter(
				(line) => line.product._id !== productId,
			),
		);

		setQuantityInputs((previous) => {
			const next = { ...previous };
			delete next[productId];
			return next;
		});
	}

	function clearBill() {
		setCart([]);
		setQuantityInputs({});
		setDiscountInput('0');
		setCreditPaid('0');
		setCustomerId('');
		setPaymentMethod('Cash');
		setRebillingInvoiceNumber(null);
		processedRebillId.current = null;
	}

	function submitSale() {
		if (!cart.length) {
			toast.error('Add at least one product to the bill.');
			return;
		}

		if (paymentMethod === 'Credit' && !customerId) {
			toast.error(
				'Select a customer before recording a credit sale.',
			);
			return;
		}

		for (const line of cart) {
			const availableInUnit = convertFromBaseQuantity(
				getProductBaseStock(line.product),
				line.unit,
			);

			if (
				line.quantity <= 0 ||
				line.quantity > availableInUnit
			) {
				toast.error(
					`Check the quantity for ${line.product.productName}.`,
				);
				return;
			}

			if (
				getBaseUnit(line.unit) === 'pcs' &&
				!Number.isInteger(line.quantity)
			) {
				toast.error(
					`Pieces must be a whole number for ${line.product.productName}.`,
				);
				return;
			}
		}

		const items = cart.map(
			({ product, quantity, unit }) => ({
				productId: product._id,
				quantity,
				unit,
			}),
		);

		// Always create a NEW sale.
		// Never send the original invoice ID as an update target.
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
					<h1>Sales &amp; billing</h1>
					<p>
						Search products, build the basket, and complete
						the bill.
					</p>

					{rebillingInvoiceNumber && (
						<p className="mt-2 font-medium text-emerald-700">
							Rebilling from invoice {rebillingInvoiceNumber}.
							The original invoice will remain unchanged.
						</p>
					)}
				</div>

				{lastInvoice && (
					<button
						type="button"
						className="btn-secondary"
						onClick={() => window.print()}
					>
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

						<span className="count-pill">
							{products.data?.total ?? 0} matches
						</span>
					</div>

					<label
						className="sr-only"
						htmlFor="billing-search"
					>
						Search products
					</label>

					<input
						id="billing-search"
						autoFocus
						className="input"
						value={productSearch}
						onChange={(event) =>
							setProductSearch(event.target.value)
						}
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
						placeholder="Scan barcode or search by name / item code"
					/>

					<div className="product-pick-list">
						{products.isPending && (
							<p className="empty-state">
								Loading products...
							</p>
						)}

						{products.isError && (
							<p className="empty-state text-red-700">
								{apiErrorMessage(
									products.error,
									'Products could not be loaded.',
								)}
							</p>
						)}

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
									<span>
										{product.itemCode} ·{' '}
										{product.availableStock} {product.unit}{' '}
										available
									</span>
								</span>

								<span className="product-pick-price">
									{formatCurrency(product.retailPrice)}
								</span>
							</button>
						))}

						{!products.isPending &&
							!products.isError &&
							!products.data?.items.length && (
								<p className="empty-state">
									No matching products.
								</p>
							)}
					</div>
				</section>

				<section className="data-panel pos-basket">
					<div className="panel-heading">
						<div>
							<h2>Current bill</h2>
							<p>
								{cart.length}{' '}
								{cart.length === 1
									? 'line item'
									: 'line items'}
							</p>

							{rebillingInvoiceNumber && (
								<p className="text-sm font-medium text-emerald-700">
									Based on {rebillingInvoiceNumber} · New invoice
									will be generated on completion
								</p>
							)}
						</div>

						{cart.length > 0 && (
							<button
								type="button"
								className="table-action table-action-danger"
								onClick={clearBill}
							>
								Clear bill
							</button>
						)}
					</div>

					{rebillLoading && (
						<p className="empty-state">
							Loading original invoice items...
						</p>
					)}

					{cart.length ? (
						<div className="table-scroll cart-table-wrap">
							<table className="table-dense w-full min-w-[610px]">
								<thead>
									<tr>
										<th>Item</th>
										<th>Qty</th>
										<th>Unit</th>
										<th>Rate</th>
										<th className="text-right">Amount</th>
										<th />
									</tr>
								</thead>

								<tbody>
									{cart.map((line) => {
										const {
											product,
											quantity,
											price,
											unit,
										} = line;

										const availableInUnit =
											convertFromBaseQuantity(
												getProductBaseStock(product),
												unit,
											);

										return (
											<tr key={product._id}>
												<td>
													<strong>
														{product.productName}
													</strong>

													<span className="block text-xs text-slate-500">
														{product.itemCode} ·{' '}
														{formatCurrency(price)} /{' '}
														{product.unit}
													</span>
												</td>

												<td>
													<input
														aria-label={`Quantity for ${product.productName}`}
														className="input qty-input"
														type="number"
														min={
															getBaseUnit(unit) === 'pcs'
																? 1
																: 0.001
														}
														max={availableInUnit}
														step={
															getBaseUnit(unit) === 'pcs'
																? 1
																: unit === 'Kg' || unit === 'L'
																	? 0.001
																	: 1
														}
														value={
															quantityInputs[product._id] ??
															String(quantity)
														}
														onChange={(event) => {
															const value =
																event.target.value;

															setQuantityInputs(
																(previous) => ({
																	...previous,
																	[product._id]: value,
																}),
															);

															if (value === '') return;

															const next = Number(value);

															if (
																next > 0 &&
																next <= availableInUnit &&
																(getBaseUnit(unit) !== 'pcs' ||
																	Number.isInteger(next))
															) {
																updateQuantity(
																	product._id,
																	next,
																);
															}
														}}
														onBlur={(event) => {
															const next = Number(
																event.target.value,
															);

															let validQuantity = next;

															if (
																!Number.isFinite(next) ||
																next <= 0
															) {
																validQuantity =
																	getBaseUnit(unit) === 'pcs'
																		? 1
																		: 0.001;
															}

															if (
																getBaseUnit(unit) === 'pcs'
															) {
																validQuantity = Math.round(
																	validQuantity,
																);
															}

															validQuantity = Math.min(
																validQuantity,
																availableInUnit,
															);

															if (validQuantity <= 0) {
																toast.error(
																	`${product.productName} has insufficient stock.`,
																);
																return;
															}

															updateQuantity(
																product._id,
																validQuantity,
															);

															setQuantityInputs(
																(previous) => ({
																	...previous,
																	[product._id]: String(
																		validQuantity,
																	),
																}),
															);
														}}
													/>
												</td>

												<td>
													<select
														aria-label={`Unit for ${product.productName}`}
														className="input qty-input"
														value={unit}
														onChange={(event) => {
															const nextUnit =
																event.target.value;

															const nextQuantity =
																convertQuantity(
																	quantity,
																	unit,
																	nextUnit,
																);

															setCart((current) =>
																current.map((item) =>
																	item.product._id ===
																		product._id
																		? {
																			...item,
																			quantity: nextQuantity,
																			unit: nextUnit,
																		}
																		: item,
																),
															);

															setQuantityInputs(
																(previous) => ({
																	...previous,
																	[product._id]: String(
																		nextQuantity,
																	),
																}),
															);
														}}
													>
														{getCompatibleUnits(
															product.unit,
														).map((option) => (
															<option
																key={option}
																value={option}
															>
																{option}
															</option>
														))}
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

												<td className="text-right font-semibold tabular-nums">
													{formatCurrency(getLineAmount(line))}
												</td>

												<td>
													<button
														type="button"
														className="table-action table-action-danger"
														aria-label={`Remove ${product.productName}`}
														onClick={() =>
															removeProduct(product._id)
														}
													>
														Remove
													</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					) : (
						<div className="empty-state cart-empty">
							<strong>Your bill is empty</strong>
							<p>
								Choose products from the catalog to begin.
							</p>
						</div>
					)}

					<div className="checkout-fields">
						<div>
							<label
								className="label"
								htmlFor="sale-customer"
							>
								Customer
							</label>

							<select
								id="sale-customer"
								className="input"
								value={customerId}
								onChange={(event) =>
									setCustomerId(event.target.value)
								}
								disabled={customers.isError}
							>
								<option value="">Walk-in customer</option>

								{customers.data?.items.map((customer) => (
									<option
										key={customer._id}
										value={customer._id}
									>
										{customer.name}
										{customer.phone
											? ` · ${customer.phone}`
											: ''}
									</option>
								))}
							</select>

							{customers.isError && (
								<p className="field-error">
									{apiErrorMessage(
										customers.error,
										'Customer list could not be loaded.',
									)}
								</p>
							)}
						</div>

						<div>
							<label
								className="label"
								htmlFor="sale-payment"
							>
								Payment method
							</label>

							<select
								id="sale-payment"
								className="input"
								value={paymentMethod}
								onChange={(event) =>
									setPaymentMethod(
										event.target.value as PaymentMethod,
									)
								}
							>
								<option>Cash</option>
								<option>Card</option>
								<option>UPI</option>
								<option>Credit</option>
							</select>
						</div>

						<div>
							<label
								className="label"
								htmlFor="sale-discount"
							>
								Discount amount
							</label>

							<input
								id="sale-discount"
								className="input"
								type="number"
								min="0"
								max={subtotal}
								step="0.01"
								value={discountInput}
								onChange={(event) =>
									setDiscountInput(event.target.value)
								}
							/>
						</div>

						{paymentMethod === 'Credit' && (
							<div>
								<label
									className="label"
									htmlFor="sale-paid"
								>
									Amount received
								</label>

								<input
									id="sale-paid"
									className="input"
									type="number"
									min="0"
									max={totals.finalTotal}
									step="0.01"
									value={creditPaid}
									onChange={(event) =>
										setCreditPaid(event.target.value)
									}
								/>
							</div>
						)}
					</div>

					<div className="bill-totals">
						<div>
							<span>Subtotal</span>
							<strong>{formatCurrency(subtotal)}</strong>
						</div>

						<div>
							<span>GST</span>
							<strong>{formatCurrency(gst)}</strong>
						</div>

						<div>
							<span>Discount</span>
							<strong>
								−{formatCurrency(discount)}
							</strong>
						</div>

						<div>
							<span>Round off</span>
							<strong>
								{formatCurrency(totals.roundOff)}
							</strong>
						</div>

						<div className="bill-grand-total">
							<span>Total due</span>
							<strong>
								{formatCurrency(totals.finalTotal)}
							</strong>
						</div>

						{paymentMethod === 'Credit' && (
							<div>
								<span>Balance due</span>
								<strong>
									{formatCurrency(balanceAmount)}
								</strong>
							</div>
						)}
					</div>

					<button
						type="button"
						className="btn-primary checkout-button"
						disabled={
							!cart.length ||
							createSale.isPending ||
							rebillLoading
						}
						onClick={submitSale}
					>
						{createSale.isPending
							? 'Completing sale...'
							: rebillingInvoiceNumber
								? `Create new bill · ${formatCurrency(totals.finalTotal)}`
								: `Complete sale · ${formatCurrency(totals.finalTotal)}`}
					</button>
				</section>
			</div>

			<section className="data-panel">
				<div className="panel-heading">
					<div>
						<h2>Recent invoices</h2>
						<p>Latest completed sales</p>
					</div>
				</div>

				{recentSales.isError ? (
					<p className="empty-state text-red-700">
						{apiErrorMessage(
							recentSales.error,
							'Recent sales could not be loaded.',
						)}
					</p>
				) : (
					<div className="table-scroll">
						<table className="table-dense w-full min-w-[620px]">
							<thead>
								<tr>
									<th>Invoice</th>
									<th>Customer</th>
									<th>Date</th>
									<th>Payment</th>
									<th className="text-right">Total</th>
								</tr>
							</thead>

							<tbody>
								{recentSales.data?.items.map((invoice) => (
									<tr key={invoice._id}>
										<td className="font-mono text-xs font-semibold">
											{invoice.invoiceNumber}
										</td>

										<td>{invoice.customerName}</td>

										<td>{formatDate(invoice.createdAt)}</td>

										<td>
											<span className="status-pill">
												{invoice.paymentMethod}
											</span>
										</td>

										<td className="text-right font-semibold">
											{formatCurrency(invoice.grandTotal)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{lastInvoice &&
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
					document.body,
				)}
		</div>
	);
}
