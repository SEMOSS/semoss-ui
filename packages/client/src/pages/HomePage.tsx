import { observer } from 'mobx-react-lite';
import { Stack, Typography } from '@semoss/ui';

import { Page } from '@/components/ui';
import { Link } from 'react-router-dom';

/**
 * Library page that allows a user to see all the currently installed apps
 */
export const HomePage = observer((): JSX.Element => {
    return (
        <Page
            header={
                <Stack
                    direction="row"
                    alignItems={'center'}
                    justifyContent={'space-between'}
                    spacing={4}
                >
                    <Typography variant={'h4'}>Home</Typography>
                </Stack>
            }
        >
            <Stack spacing={1}>
                <Link to={'/app/new'}> New App</Link>
                <Link to={'/app/1'}> App 1</Link>
                <Link to={'/app/1'}> App 2</Link>
                <Link to={'/app/1'}> App 3</Link>
            </Stack>
        </Page>
    );
});
