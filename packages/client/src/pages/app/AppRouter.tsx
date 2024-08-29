import { observer } from 'mobx-react-lite';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppDetailPage } from './AppDetailPage';
import { AppPage } from './AppPage';
import { NewAppPage } from './NewAppPage';

// Fix these
import { NavigatorLayout } from '../NavigatorLayout';
import { HeaderLayout } from '../HeaderLayout';
import { NewPromptBuilderAppPage } from './NewPromptBuilderAppPage';
import { NewAIConductorPage } from './NewAIConductorPage';
import { EditAppPage } from './EditAppPage';

export const AppRouter = observer(() => {
    return (
        <Routes>
            {/* New Apps */}
            <Route path="new" element={<NavigatorLayout />}>
                <Route index element={<NewAppPage />} />
                <Route path="prompt" element={<NewPromptBuilderAppPage />} />
                <Route path="conductor" element={<NewAIConductorPage />} />
            </Route>
            {/* Already Built App */}
            <Route path=":appId" element={<HeaderLayout />}>
                <Route index element={<AppPage />} />
                <Route path="edit" element={<EditAppPage />} />
                <Route path="detail" element={<AppDetailPage />} />
            </Route>
            <Route path="*" element={<Navigate to={`/`} replace />} />
        </Routes>
    );
});
