import { useNavigate } from 'react-router-dom';

import { NewAppStep } from '@/components/app';
import { PromptBuilder } from '@/components/prompt';

export const NewPromptBuilderAppPage = () => {
    const navigate = useNavigate();

    return (
        <NewAppStep
            title={'Agent Builder'}
            previous={{
                title: 'New App',
                onClick: () => navigate('/app/new'),
            }}
            isLoading={false}
        >
            <PromptBuilder />
        </NewAppStep>
    );
};
