import { useParams, useLocation } from 'react-router-dom';
import { Permissions } from '@/components/database';

export const StorageSettingsDetailPage = () => {
    const { id } = useParams();
    const { state } = useLocation();

    return (
        <Permissions
            config={{
                id: id,
                name: state ? state.name : 'Name not provided',
                global: state ? state.global : false,
            }}
        ></Permissions>
    );
};
