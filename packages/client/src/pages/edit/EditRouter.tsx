import { Routes, Route } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { EditLayout } from './EditLayout';

import { EditPipelinePage } from './EditPipelinePage';

export const EditRouter = observer(() => {
    return (
        <Routes>
            <Route path=":insightID" element={<EditLayout />}>
                <Route path="pipeline" element={<EditPipelinePage />} />
            </Route>
        </Routes>
    );
});
