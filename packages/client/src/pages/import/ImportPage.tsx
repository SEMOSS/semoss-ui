import { ImportPageContent } from './ImportPageContent';
import { ImportLayout } from './ImportLayout';

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
            <ImportLayout>
                <ImportPageContent name={name} type={type} />
            </ImportLayout>
        </>
    );
};
