import { Routes, Route } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { WorkspaceLayout } from './WorkspaceLayout';

import { WorkspacePipelinePage } from './WorkspacePipelinePage';

export const WorkspaceRouter = observer(() => {
    return (
        <Routes>
            <Route path="/" element={<WorkspaceLayout />}>
                <Route path="pipeline" element={<WorkspacePipelinePage />} />
            </Route>
        </Routes>
    );
});
