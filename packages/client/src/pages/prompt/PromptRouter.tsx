import { observer } from 'mobx-react-lite';
import { Routes, Route } from 'react-router-dom';
import { PromptPage } from './PromptPage';
import { PromptBuilder } from '@/components/prompt';

export const PromptRouter = observer(() => {
    return (
        <Routes>
            <Route index element={<PromptPage />} />
        </Routes>
    );
});
