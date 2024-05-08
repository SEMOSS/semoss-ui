import { observer } from 'mobx-react-lite';

import { NotebookTokensMenu } from './NotebookTokensMenu';

/**
 * Render the queries menu of the nodebook
 */
export const NotebookVariablesMenu = observer((): JSX.Element => {
    return <NotebookTokensMenu />;
});
