import { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { LoadingScreen } from '@/components/ui';
import { useRootStore } from '@/hooks';
import { MyProfilePage } from './MyProfilePage';

export const UserProfilePage = () => {
    const location = useLocation();
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const { configStore, monolithStore } = useRootStore();
    const { admin } = configStore.store.user;
    const [page] = useState<number>(0);
    const [rowsPerPage] = useState<number>(5);

    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (userId && admin) {
                try {
                    const response = await monolithStore.getUserInfoByID(
                        true, // admin
                        userId,
                        (page + 1) * rowsPerPage - rowsPerPage, // offset
                        rowsPerPage, // limit
                    );
                    if (response?.length > 0) {
                        setUserInfo(response[0]);
                    }
                } catch (error) {
                    console.error('Error fetching user info:', error);
                }
            }
            setLoading(false);
        };

        fetchUserInfo();
    }, [userId, page, rowsPerPage]);

    // If not admin, redirect to settings
    if (!admin) {
        return <Navigate to="/settings" replace />;
    }

    // If no userId provided, redirect to members page
    if (!userId) {
        return <Navigate to="/settings/members" replace />;
    }

    if (loading) {
        return <LoadingScreen.Trigger description="Loading user profile" />;
    }

    if (!userInfo) {
        return <Navigate to="/settings/members" replace />;
    }

    return <MyProfilePage userInfo={userInfo} />;
};
