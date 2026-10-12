export type ProductUnit = 'Kg' | 'g' | 'L' | 'ml' | 'Pcs' | 'Pkt';
export type BaseUnit = 'g' | 'ml' | 'pcs';

const unitDetails: Record<ProductUnit, { baseUnit: BaseUnit; factor: number }> = {
  Kg: { baseUnit: 'g', factor: 1000 },
  g: { baseUnit: 'g', factor: 1 },
  L: { baseUnit: 'ml', factor: 1000 },
  ml: { baseUnit: 'ml', factor: 1 },
  Pcs: { baseUnit: 'pcs', factor: 1 },
  Pkt: { baseUnit: 'pcs', factor: 1 },
};

export function getBaseUnit(unit: string): BaseUnit {
  return unitDetails[unit as ProductUnit].baseUnit;
}

export function getUnitFactor(unit: string): number {
  return unitDetails[unit as ProductUnit].factor;
}

export function convertToBaseQuantity(quantity: number, unit: string): number {
  return quantity * getUnitFactor(unit);
}

export function convertFromBaseQuantity(baseQuantity: number, unit: string): number {
  return baseQuantity / getUnitFactor(unit);
}

export function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number {
  if (getBaseUnit(fromUnit) !== getBaseUnit(toUnit)) {
    throw new RangeError(`Cannot convert ${fromUnit} to ${toUnit}`);
  }
  return convertFromBaseQuantity(convertToBaseQuantity(quantity, fromUnit), toUnit);
}

export function calculateUnitPriceAmount(
  quantity: number,
  quantityUnit: string,
  unitPrice: number,
  priceUnit: string
): number {
  if (getBaseUnit(quantityUnit) !== getBaseUnit(priceUnit)) {
    throw new RangeError(`Cannot price ${quantityUnit} using a ${priceUnit} rate`);
  }
  return unitPrice * convertToBaseQuantity(quantity, quantityUnit) / getUnitFactor(priceUnit);
}

export function getCompatibleUnits(unit: string): ProductUnit[] {
  const baseUnit = getBaseUnit(unit);
  if (baseUnit === 'g') return ['Kg', 'g'];
  if (baseUnit === 'ml') return ['L', 'ml'];
  return unit === 'Pkt' ? ['Pkt', 'Pcs'] : ['Pcs', 'Pkt'];
}

export function formatQuantity(quantity: number, unit: string): string {
  const maximumFractionDigits = getUnitFactor(unit) === 1 && getBaseUnit(unit) === 'pcs' ? 0 : 3;
  return `${quantity.toLocaleString('en-IN', { maximumFractionDigits })} ${unit}`;
}