import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { apiGet, apiPut } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const settingsSchema = z.object({
	shopName: z.string().trim().min(1, 'Shop name is required').max(120),
	address: z.string().max(500),
	phone: z.string().max(30),
	gstNumber: z.string().max(30),
	currencySymbol: z.string().trim().min(1, 'Currency symbol is required').max(5),
	lowStockDefault: z.number().int().min(0).max(99999),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface ShopSettings extends SettingsFormValues {
	_id: string;
	createdAt?: string;
	updatedAt?: string;
}

const defaultSettings: SettingsFormValues = {
	shopName: '',
	address: '',
	phone: '',
	gstNumber: '',
	currencySymbol: '₹',
	lowStockDefault: 5,
};

export function SettingsPage() {
	const queryClient = useQueryClient();
	const { hasRole } = useAuth();
	const canEdit = hasRole('ADMIN');
	const { data, isPending, isError, refetch } = useQuery({
		queryKey: ['settings'],
		queryFn: () => apiGet<ShopSettings>('/settings'),
		staleTime: 5 * 60 * 1000,
	});
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<SettingsFormValues>({
		resolver: zodResolver(settingsSchema),
		defaultValues: defaultSettings,
	});

	useEffect(() => {
		if (data && !isDirty) {
			reset({
				shopName: data.shopName,
				address: data.address,
				phone: data.phone,
				gstNumber: data.gstNumber,
				currencySymbol: data.currencySymbol,
				lowStockDefault: data.lowStockDefault,
			});
		}
	}, [data, isDirty, reset]);

	const saveSettings = useMutation({
		mutationFn: (values: SettingsFormValues) => apiPut<ShopSettings>('/settings', values),
		onSuccess: async (savedSettings) => {
			reset({
				shopName: savedSettings.shopName,
				address: savedSettings.address,
				phone: savedSettings.phone,
				gstNumber: savedSettings.gstNumber,
				currencySymbol: savedSettings.currencySymbol,
				lowStockDefault: savedSettings.lowStockDefault,
			});
			await queryClient.invalidateQueries({ queryKey: ['settings'] });
			toast.success('Settings saved');
		},
		onError: () => toast.error('Could not save settings. Please try again.'),
	});

	if (isPending) {
		return <p className="text-sm text-slate-600">Loading settings...</p>;
	}

	if (isError) {
		return (
			<div className="space-y-3">
				<h1 className="text-2xl font-bold text-slate-900">Settings</h1>
				<div className="card flex flex-wrap items-center justify-between gap-3 p-4">
					<p className="text-sm text-red-700">Settings could not be loaded.</p>
					<button type="button" className="btn-secondary" onClick={() => refetch()}>
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<header>
				<h1 className="text-2xl font-bold text-slate-900">Settings</h1>
				<p className="text-sm text-slate-600">Shop details and inventory defaults</p>
			</header>

			<form
				className="card max-w-3xl space-y-4 p-4 md:p-5"
				onSubmit={handleSubmit((values) => saveSettings.mutate(values))}
			>
				{!canEdit && (
					<p className="border-l-2 border-blue-600 bg-blue-50 px-3 py-2 text-sm text-blue-900">
						You have read-only access to these settings.
					</p>
				)}

				<fieldset disabled={!canEdit || saveSettings.isPending} className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<label className="label" htmlFor="shopName">Shop name</label>
							<input id="shopName" className="input" maxLength={120} {...register('shopName')} />
							{errors.shopName && <p className="mt-1 text-xs text-red-700">{errors.shopName.message}</p>}
						</div>

						<div className="sm:col-span-2">
							<label className="label" htmlFor="address">Address</label>
							<textarea id="address" className="input min-h-20 resize-y" maxLength={500} {...register('address')} />
							{errors.address && <p className="mt-1 text-xs text-red-700">{errors.address.message}</p>}
						</div>

						<div>
							<label className="label" htmlFor="phone">Phone</label>
							<input id="phone" className="input" type="tel" maxLength={30} {...register('phone')} />
							{errors.phone && <p className="mt-1 text-xs text-red-700">{errors.phone.message}</p>}
						</div>

						<div>
							<label className="label" htmlFor="gstNumber">GST number</label>
							<input id="gstNumber" className="input" maxLength={30} {...register('gstNumber')} />
							{errors.gstNumber && <p className="mt-1 text-xs text-red-700">{errors.gstNumber.message}</p>}
						</div>

						<div>
							<label className="label" htmlFor="currencySymbol">Currency symbol</label>
							<input id="currencySymbol" className="input" maxLength={5} {...register('currencySymbol')} />
							{errors.currencySymbol && <p className="mt-1 text-xs text-red-700">{errors.currencySymbol.message}</p>}
						</div>

						<div>
							<label className="label" htmlFor="lowStockDefault">Default low-stock threshold</label>
							<input
								id="lowStockDefault"
								className="input"
								type="number"
								min={0}
								max={99999}
								step={1}
								{...register('lowStockDefault', { valueAsNumber: true })}
							/>
							{errors.lowStockDefault && <p className="mt-1 text-xs text-red-700">{errors.lowStockDefault.message}</p>}
						</div>
					</div>
				</fieldset>

				{canEdit && (
					<div className="flex justify-end border-t border-slate-100 pt-4">
						<button
							type="submit"
							className="btn-primary"
							disabled={!isDirty || saveSettings.isPending}
						>
							{saveSettings.isPending ? 'Saving...' : 'Save settings'}
						</button>
					</div>
				)}
			</form>
		</div>
	);
}
