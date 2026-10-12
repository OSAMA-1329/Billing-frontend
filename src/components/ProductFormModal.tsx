import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from './Modal';
import type { Product } from '../types';

const schema = z.object({
  itemCode: z.string().min(1),
  barcode: z.string().optional(),
  productName: z.string().min(1),
  tamilProductName: z.string().optional(),
  unit: z.enum(['Kg', 'g', 'L', 'ml', 'Pcs', 'Pkt']),
  hsnCode: z.string().optional(),
  manufacturer: z.string().optional(),
  mrp: z.coerce.number().min(0),
  purchaseCost: z.coerce.number().min(0),
  marginPercent: z.coerce.number().min(0).optional(),
  gstPercent: z.coerce.number().min(0).optional(),
  retailPrice: z.coerce.number().min(0),
  wholesalePrice: z.coerce.number().min(0).optional(),
  pointPercent: z.coerce.number().min(0).optional(),
  openingStock: z.coerce.number().min(0).optional(),
  availableStock: z.coerce.number().min(0).optional(),
  godownLocation: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof schema>;

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  initial?: Product | null;
}

export function ProductFormModal({ open, onClose, onSubmit, initial }: ProductFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    values: initial
      ? {
          itemCode: initial.itemCode,
          barcode: initial.barcode || '',
          productName: initial.productName,
          tamilProductName: initial.tamilProductName || '',
          unit: initial.unit,
          hsnCode: initial.hsnCode || '',
          manufacturer: initial.manufacturer || '',
          mrp: initial.mrp,
          purchaseCost: initial.purchaseCost,
          marginPercent: initial.marginPercent,
          gstPercent: initial.gstPercent,
          retailPrice: initial.retailPrice,
          wholesalePrice: initial.wholesalePrice,
          pointPercent: initial.pointPercent,
          availableStock: initial.availableStock,
          godownLocation: initial.godownLocation || '',
        }
      : {
          unit: 'Pcs',
          marginPercent: 0,
          gstPercent: 0,
          pointPercent: 0,
          openingStock: 0,
        },
  });

  return (
    <Modal open={open} title={initial ? 'Edit Product' : 'Add Product'} onClose={onClose} wide>
      <form
        className="grid gap-3 md:grid-cols-3"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
          reset();
          onClose();
        })}
      >
        {(
          [
            ['itemCode', 'Item Code'],
            ['barcode', 'Barcode'],
            ['productName', 'Product Name'],
            ['tamilProductName', 'Tamil Product Name'],
            ['unit', 'Unit'],
            ['hsnCode', 'HSN Code'],
            ['manufacturer', 'MFR/Brand'],
            ['mrp', 'MRP'],
            ['purchaseCost', 'Purchase Cost'],
            ['marginPercent', 'Margin %'],
            ['gstPercent', 'GST %'],
            ['retailPrice', 'Retail Price'],
            ['wholesalePrice', 'Wholesale Price'],
            ['pointPercent', 'Point %'],
            ...(initial ? [['availableStock', `Stock on hand (${initial.unit})`] as const] : []),
            ...(!initial ? [['openingStock', 'Opening Stock'] as const] : []),
            ['godownLocation', 'Godown Location'],
          ] as const
        ).map(([name, label]) => (
          <div key={name}>
            <label className="label">{label}</label>
            {name === 'unit' ? (
              initial ? (
                <div className="input flex items-center bg-slate-50 text-slate-600">{initial.unit}</div>
              ) : <select className="input" {...register('unit')}>
                <option value="Kg">Kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="Pcs">Pcs</option>
                <option value="Pkt">Pkt</option>
              </select>
            ) : (
              <input
                className="input"
                step={name === 'availableStock' ? initial?.unit === 'Pcs' || initial?.unit === 'Pkt' ? '1' : '0.001' : ['mrp', 'purchaseCost', 'retailPrice', 'wholesalePrice'].includes(name) ? '0.01' : name.includes('Percent') || name === 'openingStock' ? '0.001' : undefined}
                min={['openingStock', 'availableStock'].includes(name) ? '0' : undefined}
                type={['mrp', 'purchaseCost', 'marginPercent', 'gstPercent', 'retailPrice', 'wholesalePrice', 'pointPercent', 'openingStock', 'availableStock'].includes(name) ? 'number' : 'text'}
                {...register(name)}
              />
            )}
          </div>
        ))}
        <div className="md:col-span-3 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            Save Product
          </button>
        </div>
      </form>
    </Modal>
  );
}
