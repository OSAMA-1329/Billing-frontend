import { PartyManagementPage } from '../components/PartyManagementPage';
import { useAuth } from '../contexts/AuthContext';

export function CustomersPage() {
	const { hasRole } = useAuth();
	return <PartyManagementPage kind="customers" canEdit={hasRole('ADMIN', 'MANAGER')} />;
}
