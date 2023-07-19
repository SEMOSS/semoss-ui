import { useParams, useLocation } from 'react-router-dom';
import { Permissions } from '@/components/database';

export const InsightSettingsDetailPage = () => {
    const { id, projectId } = useParams();
    const { state } = useLocation();

    return (
        <Permissions
            config={{
                id: id,
                projectid: projectId,
                name: state ? state.name : 'Name not provided',
                global: state ? state.global : false,
                permission: state ? state.permission : 3,
            }}
        ></Permissions>
    );
};
