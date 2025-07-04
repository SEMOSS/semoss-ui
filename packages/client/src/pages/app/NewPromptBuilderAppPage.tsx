import { useNavigate } from 'react-router-dom';

import { NewAppStep } from '@/components/app';
import { PromptBuilder } from '@/components/prompt';
import { NavbarLeft, NavbarHeader } from '../../components/shared';

export const NewPromptBuilderAppPage = () => {
    return (
        <>
            <NavbarLeft>
                <NavbarHeader />
            </NavbarLeft>
            <NewAppStep>
                <PromptBuilder />
            </NewAppStep>
        </>
    );
};
