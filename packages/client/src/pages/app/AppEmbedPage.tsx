import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';

/**
 * Embed the app in another page
 */
export const AppEmbedPage = observer((): JSX.Element => {
    const { projectId, id } = useParams();

    return (
        <div>
            TODO Load insight based on projectId - {projectId} and id - ${id}
        </div>
    );
});
