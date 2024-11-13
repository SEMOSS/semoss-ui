import { Navigate } from 'react-router-dom';
import { useSettings } from '@/hooks';
import { UserTable } from '@/components/settings';

export const MemberSettingsPage = () => {
    const { adminMode } = useSettings();

    if (!adminMode) {
        return <Navigate to="/settings" />;
    }

    return <UserTable />;
};
