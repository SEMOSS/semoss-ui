import { useMemo } from 'react';
import {
    useParams,
    useLocation,
    useNavigate,
    matchPath,
    Outlet,
} from 'react-router-dom';

import { Insight } from '@/components/insight';

const REGISTRY = {};

export const EditLayout = () => {
    const { insightID } = useParams();

    return (
        <Insight id={insightID} registry={REGISTRY}>
            <Outlet />
        </Insight>
    );
};
