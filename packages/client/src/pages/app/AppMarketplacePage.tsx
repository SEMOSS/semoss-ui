import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Stack, styled, Typography } from '@semoss/ui';

import { AppTemplates, NewAppModal } from '@/components/app';
import { Filterbox } from '@/components/ui';
import { NavbarLeft, NavbarHeader } from '../../components/shared';

const StyledTypographyHome = styled(Typography)<
    React.ComponentProps<typeof Typography> & {
        onClick?: React.MouseEventHandler<any>;
    }
>(({ theme }) => ({
    color: '#212121',
    FontFamily: 'Inter',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '24px',
    letterSpacing: '0.15px',
    fontStyle: 'normal',
}));

const StyledTypographySeperator = styled(Typography)<
    React.ComponentProps<typeof Typography>
>(({ theme }) => ({
    color: '#666',
    FontFamily: 'Inter',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '24px',
    letterSpacing: '0.15px',
    fontStyle: 'normal',
}));

const StyledTypographyBrowseTemplates = styled(Typography)<
    React.ComponentProps<typeof Typography>
>(({ theme }) => ({
    color: '#9E9E9E',
    FontFamily: 'Inter',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '24px',
    letterSpacing: '0.15px',
    fontStyle: 'normal',
}));

export const AppMarketplacePage = () => {
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

        navigate(`/app/${appId}/edit`);
    };
    return (
        <>
            <NavbarLeft>
                <NavbarHeader />
            </NavbarLeft>
            <Stack direction="column" gap={2}>
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
                            {/* Breadcrumb */}
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <StyledTypographyHome
                                    variant="body1"
                                    onClick={() => navigate('/')}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Home
                                </StyledTypographyHome>
                                <StyledTypographySeperator
                                    variant="body1"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    /
                                </StyledTypographySeperator>
                                <StyledTypographyBrowseTemplates
                                    variant="body1"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    Browse Templates
                                </StyledTypographyBrowseTemplates>
                            </Stack>

                            <Typography variant={'h4'}>
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
                <Stack
                    direction={'column'}
                    alignItems={'flex-start'}
                    spacing={2}
                    style={{ flex: 1, width: '100%' }}
                >
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
                    <div
                        style={{
                            display: 'flex',
                            flex: 1,
                            width: '100%',
                            gap: '24px',
                            minHeight: 0,
                        }}
                    >
                        <div style={{ width: '355px', flexShrink: 0 }}>
                            <Filterbox
                                type={'BROWSETEMPLATES'}
                                onChange={(
                                    filters: Record<string, unknown>,
                                ) => {
                                    // setMetaFilters(filters);
                                }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
                            <AppTemplates
                                onUse={(t) => {
                                    setNewAppOptions({
                                        type: 'blocks',
                                        state: t.state,
                                    });
                                }}
                            />
                        </div>
                    </div>
                </Stack>
            </Stack>
        </>
    );
};
