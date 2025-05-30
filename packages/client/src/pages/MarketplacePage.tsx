import React, { useState } from 'react';
import { Page } from '@/components/ui';
import {
    Button,
    InputAdornment,
    Search,
    Stack,
    TextField,
    Typography,
} from '@semoss/ui';
import { AppTemplates, NewAppModal } from '@/components/app';
import { useNavigate } from 'react-router-dom';

export const MarketplacePage = () => {
    const navigate = useNavigate();
    const [newAppOptions, setNewAppOptions] = useState<
        React.ComponentProps<typeof NewAppModal>['options'] | null
    >(null);
    const isNameOpen = !!newAppOptions;

    /**
     * Navigate to the app and open it
     *
     * appId - appId of the app
     */
    const navigateApp = (appId: string) => {
        if (!appId) {
            return;
        }

        navigate(`/workspace/${appId}`);
    };
    return (
        <Page
            header={
                <Stack>
                    <Stack
                        direction="row"
                        alignItems={'center'}
                        justifyContent={'space-between'}
                        spacing={4}
                    >
                        <Stack
                            direction={'column'}
                            alignItems={'flex-start'}
                            spacing={1}
                        >
                            <Typography variant={'h5'}>
                                Browse Templates
                            </Typography>
                            <Typography variant={'body1'}>
                                Don’t know where to start? Don’t worry! Browse
                                our collection of templates to start
                                personalizing the app to your specific use case.
                            </Typography>
                        </Stack>
                    </Stack>
                </Stack>
            }
        >
            <Stack direction={'column'} alignItems={'flex-start'} spacing={2}>
                {isNameOpen ? (
                    <NewAppModal
                        open={isNameOpen}
                        options={newAppOptions}
                        onClose={(appId) => {
                            if (appId) {
                                navigateApp(appId);
                            } else {
                                // close the modal
                                setNewAppOptions(null);
                            }
                        }}
                    />
                ) : null}
                <AppTemplates
                    onUse={(t) => {
                        setNewAppOptions({
                            type: 'blocks',
                            state: t.state,
                        });
                    }}
                />
            </Stack>
        </Page>
    );
};
