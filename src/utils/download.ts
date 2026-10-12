import { api } from '../api/client';

export async function downloadExport(path: string, filename: string, params?: Record<string, string>) {
  const res = await api.get(path, { params, responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
