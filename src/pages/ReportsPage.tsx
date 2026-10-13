import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../api/client';
import { SaleDetailsModal } from '../components/SaleDetailsModal';
import { downloadExport } from '../utils/download';
import { formatCurrency, formatDate } from '../utils/format';

type ReportKey = 'sales' | 'purchases' | 'stock' | 'profit' | 'customer-outstanding' | 'supplier-outstanding';
type CellValue = string | number | boolean | null | undefined;

interface ReportRow {
	[key: string]: CellValue;
}

interface ReportData {
	items: ReportRow[];
	total?: number;
	page?: number;
	limit?: number;
	summary?: Record<string, number>;
}

interface ReportConfig {
	title: string;
	endpoint: string;
	columns: { key: string; label: string; format?: 'currency' | 'date' | 'number' }[];
	summaries: { key: string; label: string; format?: 'currency' | 'number' }[];
	exportPath?: string;
	exportName?: string;
}

const reportConfigs: Record<ReportKey, ReportConfig> = {
	sales: {
		title: 'Sales', endpoint: '/reports/sales',
		columns: [
			{ key: 'invoiceNumber', label: 'Invoice' }, { key: 'customerName', label: 'Customer' },
			{ key: 'createdAt', label: 'Date', format: 'date' }, { key: 'paymentMethod', label: 'Payment' },
			{ key: 'grandTotal', label: 'Total', format: 'currency' },
		],
		summaries: [{ key: 'grandTotal', label: 'Sales value', format: 'currency' }, { key: 'count', label: 'Invoices', format: 'number' }],
		exportPath: '/sales/export', exportName: 'sales.xlsx',
	},
	purchases: {
		title: 'Purchases', endpoint: '/reports/purchases',
		columns: [
			{ key: 'invoiceNumber', label: 'Invoice' }, { key: 'supplierName', label: 'Supplier' },
			{ key: 'invoiceDate', label: 'Date', format: 'date' }, { key: 'status', label: 'Status' },
			{ key: 'totalAmount', label: 'Total', format: 'currency' },
		],
		summaries: [{ key: 'totalAmount', label: 'Purchase value', format: 'currency' }, { key: 'count', label: 'Invoices', format: 'number' }],
		exportPath: '/purchases/export', exportName: 'purchases.xlsx',
	},
	stock: {
		title: 'Stock valuation', endpoint: '/reports/stock',
		columns: [
			{ key: 'itemCode', label: 'Item code' }, { key: 'productName', label: 'Product' },
			{ key: 'availableStock', label: 'On hand', format: 'number' }, { key: 'purchaseCost', label: 'Unit cost', format: 'currency' },
			{ key: 'retailPrice', label: 'Retail price', format: 'currency' },
		],
		summaries: [{ key: 'stockValue', label: 'Inventory cost', format: 'currency' }, { key: 'units', label: 'Units on hand', format: 'number' }],
		exportPath: '/stock/export', exportName: 'stock.xlsx',
	},
	profit: {
		title: 'Profit by product', endpoint: '/reports/profit',
		columns: [
			{ key: 'productName', label: 'Product' }, { key: 'qty', label: 'Units sold', format: 'number' },
			{ key: 'revenue', label: 'Revenue', format: 'currency' }, { key: 'cost', label: 'Cost', format: 'currency' },
			{ key: 'profit', label: 'Gross profit', format: 'currency' },
		],
		summaries: [{ key: 'revenue', label: 'Revenue', format: 'currency' }, { key: 'cost', label: 'Cost', format: 'currency' }, { key: 'profit', label: 'Gross profit', format: 'currency' }],
	},
	'customer-outstanding': {
		title: 'Customer outstanding', endpoint: '/reports/customer-outstanding',
		columns: [{ key: 'name', label: 'Customer' }, { key: 'phone', label: 'Phone' }, { key: 'currentBalance', label: 'Balance due', format: 'currency' }],
		summaries: [],
	},
	'supplier-outstanding': {
		title: 'Supplier outstanding', endpoint: '/reports/supplier-outstanding',
		columns: [{ key: 'name', label: 'Supplier' }, { key: 'phone', label: 'Phone' }, { key: 'currentBalance', label: 'Balance due', format: 'currency' }],
		summaries: [],
	},
};

function displayValue(value: CellValue, format?: 'currency' | 'date' | 'number') {
	if (value === null || value === undefined || value === '') return '—';
	if (format === 'currency' && typeof value === 'number') return formatCurrency(value);
	if (format === 'date' && typeof value === 'string') return formatDate(value);
	if (format === 'number' && typeof value === 'number') return value.toLocaleString('en-IN');
	return String(value);
}

export function ReportsPage() {
 const navigate = useNavigate();
	const [report, setReport] = useState<ReportKey>('sales');
	const [selectedSaleId, setSelectedSaleId] = useState('');
	const [fromInput, setFromInput] = useState('');
	const [toInput, setToInput] = useState('');
	const [searchInput, setSearchInput] = useState('');
	const [filters, setFilters] = useState({ from: '', to: '', search: '' });
	const [page, setPage] = useState(1);
	const config = reportConfigs[report];
	const reportQuery = useQuery({
		queryKey: ['report', report, filters, page],
		queryFn: () => apiGet<ReportData>(config.endpoint, {
			from: filters.from || undefined,
			to: filters.to || undefined,
			search: filters.search || undefined,
			page,
			limit: 50,
		}),
	});
	const totalPages = reportQuery.data?.limit && reportQuery.data.total
		? Math.max(1, Math.ceil(reportQuery.data.total / reportQuery.data.limit))
		: 1;

	function applyFilters(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setPage(1);
		setFilters({ from: fromInput, to: toInput, search: searchInput.trim() });
	}

	const exportParams = filters.from || filters.to ? { from: filters.from, to: filters.to } : undefined;

	return (
		<div className="page-stack">
			<header className="page-heading">
				<div><p className="eyebrow">Business intelligence</p><h1>Reports</h1><p>Review sales, purchasing, inventory value, and outstanding balances.</p></div>
				{config.exportPath && <button type="button" className="btn-secondary" onClick={() => downloadExport(config.exportPath!, config.exportName!, exportParams)}>Export Excel</button>}
			</header>

			<section className="data-panel report-controls">
				<div className="report-type-row">
					<label className="label" htmlFor="report-type">Report</label>
					<select id="report-type" className="input" value={report} onChange={(event) => { setReport(event.target.value as ReportKey); setPage(1); }}>
						{Object.entries(reportConfigs).map(([key, item]) => <option key={key} value={key}>{item.title}</option>)}
					</select>
				</div>
				<form className="report-filter-form" onSubmit={applyFilters}>
					<div><label className="label" htmlFor="report-from">From</label><input id="report-from" className="input" type="date" value={fromInput} onChange={(event) => setFromInput(event.target.value)} /></div>
					<div><label className="label" htmlFor="report-to">To</label><input id="report-to" className="input" type="date" value={toInput} onChange={(event) => setToInput(event.target.value)} /></div>
					<div className="report-search"><label className="label" htmlFor="report-search">Search</label><input id="report-search" className="input" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Invoice, product, or party" /></div>
					<button type="submit" className="btn-primary report-apply">Apply filters</button>
				</form>
			</section>

			{config.summaries.length > 0 && (
				<div className="metric-strip report-metrics">
					{config.summaries.map((metric, index) => <div key={metric.key} className={`metric-tile ${['metric-mint', 'metric-peach', 'metric-lilac'][index % 3]}`}><span>{metric.label}</span><strong>{displayValue(reportQuery.data?.summary?.[metric.key], metric.format)}</strong></div>)}
				</div>
			)}

			<section className="data-panel">
				<div className="panel-heading"><div><h2>{config.title}</h2><p>{reportQuery.data?.total ?? reportQuery.data?.items.length ?? 0} records</p></div><span className="count-pill">{filters.from || filters.to ? `${filters.from || 'Start'} — ${filters.to || 'Today'}` : 'All dates'}</span></div>
				{reportQuery.isPending ? <p className="empty-state">Loading report...</p> : reportQuery.isError ? <div className="empty-state"><p>Report could not be loaded.</p><button type="button" className="btn-secondary mt-3" onClick={() => reportQuery.refetch()}>Retry</button></div> : reportQuery.data.items.length ? (
					<div className="table-scroll"><table className="table-dense w-full min-w-[680px]">
						<thead><tr>{config.columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
						<tbody>{reportQuery.data.items.map((row, rowIndex) => <tr key={String(row._id ?? row.invoiceNumber ?? row.name ?? row.productName ?? rowIndex)}>{config.columns.map((column) => <td key={column.key} className={column.format === 'currency' || column.format === 'number' ? 'text-right tabular-nums' : ''}>{report === 'sales' && column.key === 'invoiceNumber' ? <button type="button" className="table-action" onClick={() => setSelectedSaleId(String(row._id))}>{displayValue(row[column.key], column.format)}</button> : displayValue(row[column.key], column.format)}</td>)}{report === 'sales' && <td className="text-right"><button type="button" className="table-action" onClick={() => setSelectedSaleId(String(row._id))}>View details</button></td>}</tr>)}</tbody>
					</table></div>
				) : <div className="empty-state"><strong>No {config.title.toLowerCase()} found</strong><p>Try a wider date range or different search.</p></div>}
				{report !== 'profit' && reportQuery.data && (
					<div className="table-footer"><span>Page {page} of {totalPages}</span><div className="flex gap-2"><button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><button type="button" className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
				)}
			</section>
			<SaleDetailsModal
				invoiceId={selectedSaleId}
				onClose={() => setSelectedSaleId('')}
				onRebill={(invoice) => {
					setSelectedSaleId('');
					navigate('/sales', { state: { rebill: invoice } });
				}}
			/>
		</div>
	);
}
