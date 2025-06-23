import { ImportPageContent } from './ImportPageContent';
import { ImportLayout } from './ImportLayout';

/** TODO: Refactor */
interface ImportPageTwoProps {
    /**
     * What engine are you importing
     */
    type: string;
}
export const ImportPage = (props: ImportPageTwoProps) => {
    return (
        <ImportLayout>
            <ImportPageContent type={props.type} />
        </ImportLayout>
    );
};
