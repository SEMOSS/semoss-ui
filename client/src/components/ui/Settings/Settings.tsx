import { observer } from 'mobx-react-lite';

interface SettingsProps {
    semossCoreService: unknown;
}

/**
 * Render the settings
 * @param id - id of the block to get data for
 * @param component - setting component to render
 */
export const Settings = observer((props: SettingsProps): JSX.Element => {
    const { semossCoreService } = props;

    return <div>TODO</div>;
});
