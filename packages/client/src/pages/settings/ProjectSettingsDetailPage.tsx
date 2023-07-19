import { useParams, useLocation } from 'react-router-dom';
import { Permissions } from '@/components/database';

export const ProjectSettingsDetailPage = () => {
    const { id } = useParams();
    const { state } = useLocation();

    console.log('detail page', id, state);
    return (
        <Permissions
            config={{
                id: id,
                name: state ? state.name : 'Name not provided',
                global: state ? state.global : false,
                permission: state ? state.permission : 3,
            }}
        ></Permissions>
    );
};
