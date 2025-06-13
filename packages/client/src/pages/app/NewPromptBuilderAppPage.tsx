import { useNavigate } from 'react-router-dom';

import { NewAppStep } from '@/components/app';
import { PromptBuilder } from '@/components/prompt';

export const NewPromptBuilderAppPage = () => {
    return (
        <NewAppStep>
            <PromptBuilder />
        </NewAppStep>
    );
};
