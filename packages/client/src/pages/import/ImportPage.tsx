import { ImportPageContent } from './ImportPageContent';
import { ImportLayout } from './ImportLayout';

import { NavbarLeft, NavbarHeader } from '../../components/shared';
import { ENGINE_TYPES } from '@/types';

/** TODO: Refactor */
interface ImportPageProps {
    /**
     * Name of the section
     */
    name: string;

    /**
     * What engine are you importing
     */
    type: ENGINE_TYPES;
}
export const ImportPage: React.FC<ImportPageProps> = ({ name, type }) => {
    return (
        <>
            <NavbarLeft>
                <NavbarHeader />
            </NavbarLeft>

            <ImportLayout>
                <ImportPageContent name={name} type={type} />
            </ImportLayout>
        </>
    );
};
