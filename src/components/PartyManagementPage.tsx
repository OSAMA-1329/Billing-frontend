import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';
import type { Paginated } from '../types';

type PartyKind = 'customers' | 'suppliers';

interface PartyRecord {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  email?: string;
  place?: string;
  currentBalance: number;
  openingBalance?: number;
}

interface PartyDraft {
  name: string;
  phone: string;
  email: string;
  address: string;
  place: string;
  gstNumber: string;
  openingBalance: string;
}

const emptyDraft: PartyDraft = {
  name: '',
  phone: '',
  email: '',
  address: '',
  place: '',
  gstNumber: '',
  openingBalance: '0',
};

export function PartyManagementPage({ kind, canEdit = true }: { kind: PartyKind; canEdit?: boolean }) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<PartyDraft>(emptyDraft);
  const [editing, setEditing] = useState<PartyRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PartyRecord | null>(null);
  const isSupplier = kind === 'suppliers';
  const title = isSupplier ? 'Suppliers' : 'Customers';

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [kind, search],
    queryFn: () => apiGet<Paginated<PartyRecord>>(`/${kind}`, { page: 1, limit: 100, search }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: [kind] });
  const saveParty = useMutation({
    mutationFn: () => {
      const payload = {
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        address: draft.address.trim(),
        gstNumber: draft.gstNumber.trim(),
        ...(isSupplier ? { email: draft.email.trim(), place: draft.place.trim() } : {}),
        ...(!editing ? { openingBalance: Number(draft.openingBalance) || 0 } : {}),
      };
      return editing
        ? apiPut<PartyRecord>(`/${kind}/${editing._id}`, payload)
        : apiPost<PartyRecord>(`/${kind}`, payload);
    },
    onSuccess: async () => {
      await refresh();
      setFormOpen(false);
      toast.success(`${title.slice(0, -1)} saved`);
    },
    onError: () => toast.error(`Could not save ${title.toLowerCase().slice(0, -1)}.`),
  });

  const deleteParty = useMutation({
    mutationFn: (id: string) => apiDelete(`/${kind}/${id}`),
    onSuccess: async () => {
      await refresh();
      setDeleteTarget(null);
      toast.success(`${title.slice(0, -1)} deleted`);
    },
    onError: () => toast.error(`Could not delete ${title.toLowerCase().slice(0, -1)}.`),
  });

  function openCreate() {
    setEditing(null);
    setDraft(emptyDraft);
    setFormOpen(true);
  }

  function openEdit(party: PartyRecord) {
    setEditing(party);
    setDraft({
      name: party.name,
      phone: party.phone ?? '',
      email: party.email ?? '',
      address: party.address ?? '',
      place: party.place ?? '',
      gstNumber: party.gstNumber ?? '',
      openingBalance: '0',
    });
    setFormOpen(true);
  }

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Directory</p>
          <h1>{title}</h1>
          <p>Keep contact details and outstanding balances up to date.</p>
        </div>
        {canEdit && <button type="button" className="btn-primary" onClick={openCreate}>Add {isSupplier ? 'supplier' : 'customer'}</button>}
      </header>

      <section className="data-panel">
        <div className="toolbar-row">
          <form
            className="search-form"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
            }}
          >
            <label className="sr-only" htmlFor={`${kind}-search`}>Search {title.toLowerCase()}</label>
            <input
              id={`${kind}-search`}
              className="input"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={`Search ${title.toLowerCase()} by name`}
            />
            <button type="submit" className="btn-secondary">Search</button>
          </form>
          <span className="result-count">{data?.total ?? 0} records</span>
        </div>

        {isPending ? (
          <p className="empty-state">Loading {title.toLowerCase()}...</p>
        ) : isError ? (
          <div className="empty-state">
            <p>Could not load {title.toLowerCase()}.</p>
            <button type="button" className="btn-secondary mt-3" onClick={() => refetch()}>Retry</button>
          </div>
        ) : data?.items.length ? (
          <div className="table-scroll">
            <table className="table-dense w-full min-w-[760px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  {isSupplier && <th>Place</th>}
                  <th>GST number</th>
                  <th className="text-right">Balance</th>
                  {canEdit && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data.items.map((party) => (
                  <tr key={party._id}>
                    <td>
                      <span className="font-semibold text-slate-900">{party.name}</span>
                      {isSupplier && party.email && <span className="block text-xs text-slate-500">{party.email}</span>}
                    </td>
                    <td>{party.phone || '—'}</td>
                    {isSupplier && <td>{party.place || '—'}</td>}
                    <td className="font-mono text-xs">{party.gstNumber || '—'}</td>
                    <td className="text-right tabular-nums">₹{party.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    {canEdit && <td>
                      <div className="flex justify-end gap-2">
                        <button type="button" className="table-action" onClick={() => openEdit(party)}>Edit</button>
                        <button type="button" className="table-action table-action-danger" onClick={() => setDeleteTarget(party)}>Delete</button>
                      </div>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <strong>No {title.toLowerCase()} found</strong>
            <p>Add a record or change the search.</p>
          </div>
        )}
      </section>

      <Modal open={formOpen} title={`${editing ? 'Edit' : 'Add'} ${isSupplier ? 'supplier' : 'customer'}`} onClose={() => setFormOpen(false)}>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.name.trim()) {
              toast.error('Name is required.');
              return;
            }
            saveParty.mutate();
          }}
        >
          <div className="sm:col-span-2">
            <label className="label" htmlFor="party-name">Name *</label>
            <input id="party-name" autoFocus required maxLength={120} className="input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="party-phone">Phone</label>
            <input id="party-phone" type="tel" maxLength={30} className="input" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
          </div>
          {isSupplier && (
            <div>
              <label className="label" htmlFor="party-email">Email</label>
              <input id="party-email" type="email" maxLength={120} className="input" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
            </div>
          )}
          <div>
            <label className="label" htmlFor="party-gst">GST number</label>
            <input id="party-gst" maxLength={30} className="input" value={draft.gstNumber} onChange={(event) => setDraft({ ...draft, gstNumber: event.target.value })} />
          </div>
          {isSupplier && (
            <div>
              <label className="label" htmlFor="party-place">Place</label>
              <input id="party-place" maxLength={120} className="input" value={draft.place} onChange={(event) => setDraft({ ...draft, place: event.target.value })} />
            </div>
          )}
          <div className={isSupplier ? 'sm:col-span-2' : ''}>
            <label className="label" htmlFor="party-address">Address</label>
            <textarea id="party-address" maxLength={500} className="input min-h-20 resize-y" value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} />
          </div>
          {!editing && (
            <div className="sm:col-span-2">
              <label className="label" htmlFor="party-opening">Opening balance</label>
              <input id="party-opening" type="number" min={0} step="0.01" className="input" value={draft.openingBalance} onChange={(event) => setDraft({ ...draft, openingBalance: event.target.value })} />
            </div>
          )}
          <div className="sm:col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saveParty.isPending}>
              {saveParty.isPending ? 'Saving...' : editing ? 'Save changes' : 'Create record'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${isSupplier ? 'supplier' : 'customer'}?`}
        message={`This will permanently delete ${deleteTarget?.name ?? 'this record'}.`}
        confirmLabel={deleteParty.isPending ? 'Deleting...' : 'Delete'}
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteParty.mutate(deleteTarget._id)}
      />
    </div>
  );
}