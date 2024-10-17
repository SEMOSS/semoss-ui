import { observer } from 'mobx-react-lite';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PromptPage } from './PromptPage';
// import { AppDetailPage } from './AppDetailPage';
// import { AppPage } from './AppPage';
// import { NewAppPage } from './NewAppPage';
import { PromptBuilder } from '@/components/prompt';

// Fix these
import { NavigatorLayout } from '../NavigatorLayout';
import { HeaderLayout } from '../HeaderLayout';
import { NewPromptBuilderAppPage } from '../app/NewPromptBuilderAppPage';
// import { EditAppPage } from './EditAppPage';

export const PromptRouter = observer(() => {
    return (
        <Routes>
            <Route index element={<PromptPage />} />
            {/* <Route path="new-prompt" element={<NewPromptBuilderAppPage />} /> */}
            {/* <Route path="new-prompt" element={<PromptBuilder />} /> */}
        </Routes>
    );
});
