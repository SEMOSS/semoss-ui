import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { SplitScreen } from './SplitScreen';
import {
    styled,
    Icon,
    Paper,
    Tooltip,
    Stack,
    IconButton,
    Typography,
} from '@semoss/ui';
import {
    AppEditor,
    ErrorBoundary,
    Sidebar,
    SidebarItem,
    SidebarText,
} from '@/components/common';
import {
    ArticleRounded,
    BarChartRounded,
    Code,
    DashboardRounded,
    Layers,
    MoreVert,
    SettingsRounded,
    Add,
} from '@mui/icons-material';
import { useDesigner } from '@/hooks';
import { AddBlocksMenu } from '../designer/AddBlocksMenu';
import { SelectedMenu } from '../designer/SelectedMenu';
import { LayersMenu } from '../designer/LayersMenu';
import {
    VISUALIZATION_MENU,
    DEFAULT_MENU,
} from '../designer/designer.constants';
import { NotebookVariablesMenu } from '../notebook/NotebookVariablesMenu';
import { Notebook } from '../notebook';
import { Screen } from './Screen';
import { Renderer } from '../blocks';
import { Settings } from '@/components/workspace';

/**
 * Left Styles
 */
const StyledSidebarContent = styled(Paper)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    borderRadius: '0',
    overflow: 'hidden',
}));

const StyledSidebarContentInner = styled('div')(({ theme }) => ({
    flex: '1',
    height: '100%',
    width: '100%',
}));

/**
 * Middle styles
 */
const StyledStack = styled(Stack)(({ theme }) => ({
    overflowX: 'auto',
    maxHeight: '180px', // Set a max height to trigger scrolling
    maxWidth: '95%',
}));

const StyledSheet = styled('div', {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    selected: boolean;
}>(({ theme, selected }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: selected
        ? theme.palette.background.paper
        : theme.palette.background.default,
    color: '#666',
    maxWidth: '225px',
    maxHeight: '125px',
    '&:hover': {
        cursor: 'pointer',
    },
}));

const StyledButtonContainer = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    alignItems: 'center',
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    '&:hover': {
        backgroundColor: theme.palette.primary.hover,
    },
}));

/**
 * Right styles
 */

export const DesignerTwo = observer(() => {
    const { designer } = useDesigner();

    const [view, setView] = useState<
        | 'layers'
        | 'blocks'
        | 'visualization'
        | 'variables'
        | 'files'
        | 'settings'
        | ''
    >('blocks');

    /**
     * Set the view. If it is the same, close it
     * @param v
     */
    const updateView = (v: typeof view) => {
        // set the view
        setView(v);

        // get rid of selected menu
        designer.setSelected('');
    };

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'row',
                // border: '2px solid black',
            }}
        >
            <Sidebar>
                <Stack
                    width="100%"
                    height={'100%'}
                    direction="column"
                    justifyContent={'space-between'}
                >
                    <Stack>
                        <SidebarItem
                            selected={view === 'blocks'}
                            onClick={() => updateView('blocks')}
                        >
                            <Tooltip title={'Add Blocks'} placement="right">
                                <DashboardRounded color="inherit" />
                            </Tooltip>
                            <SidebarText>Blocks</SidebarText>
                        </SidebarItem>
                        <SidebarItem
                            selected={view === 'visualization'}
                            onClick={() => updateView('visualization')}
                        >
                            <Tooltip
                                title={'Add Visualizations'}
                                placement="right"
                            >
                                <BarChartRounded color="inherit" />
                            </Tooltip>
                            <SidebarText>Viz</SidebarText>
                        </SidebarItem>
                        <SidebarItem
                            selected={view === 'layers'}
                            onClick={() => updateView('layers')}
                        >
                            <Tooltip title={'View Layers'} placement="right">
                                <Layers color="inherit" />
                            </Tooltip>
                            <SidebarText>Layers</SidebarText>
                        </SidebarItem>
                        <SidebarItem
                            selected={view === 'variables'}
                            onClick={() => updateView('variables')}
                        >
                            <Tooltip title={'View Variables'} placement="right">
                                <Code color="inherit" />
                            </Tooltip>
                            <SidebarText>Variables</SidebarText>
                        </SidebarItem>
                        <SidebarItem
                            selected={view === 'files'}
                            onClick={() => updateView('files')}
                        >
                            <Tooltip title={'View Variables'} placement="right">
                                <ArticleRounded color="inherit" />
                            </Tooltip>
                            <SidebarText>Files</SidebarText>
                        </SidebarItem>
                    </Stack>
                    <SidebarItem
                        selected={view === 'settings'}
                        onClick={() => updateView('settings')}
                    >
                        <Tooltip title={'Add Blocks'} placement="right">
                            <SettingsRounded color="inherit" />
                        </Tooltip>
                        <SidebarText>Settings</SidebarText>
                    </SidebarItem>
                </Stack>
            </Sidebar>

            {view === 'files' ? (
                <AppEditor
                    appId={'4f2f5725-a3f7-40a9-9935-45e84c53b2e1'}
                    width={'100%'}
                    onSave={() => {
                        console.log('save');
                    }}
                />
            ) : view === 'settings' ? (
                <Settings />
            ) : (
                <SplitScreen
                    left={
                        <div
                            style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                            }}
                        >
                            <StyledSidebarContent
                                elevation={7}
                                sx={{
                                    marginLeft: '0px',
                                    padding: '0px',
                                }}
                            >
                                <StyledSidebarContentInner>
                                    {designer.selected ? (
                                        <SelectedMenu />
                                    ) : (
                                        <>
                                            {view === 'layers' ? (
                                                <LayersMenu />
                                            ) : null}
                                            {view === 'blocks' ? (
                                                <AddBlocksMenu
                                                    title={'Add Blocks'}
                                                    items={DEFAULT_MENU}
                                                />
                                            ) : null}

                                            {view === 'visualization' ? (
                                                <AddBlocksMenu
                                                    title={'Add Visualization'}
                                                    items={VISUALIZATION_MENU}
                                                />
                                            ) : null}

                                            {view === 'variables' ? (
                                                <NotebookVariablesMenu />
                                            ) : null}
                                        </>
                                    )}
                                </StyledSidebarContentInner>
                            </StyledSidebarContent>
                        </div>
                    }
                    middle={
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <Stack
                                direction={'row'}
                                justifyContent={'space-between'}
                                sx={{ maxWidth: '100%' }}
                            >
                                <Stack
                                    direction={'row'}
                                    sx={{ maxWidth: '95%' }}
                                >
                                    <StyledStack direction="row" spacing={0}>
                                        {[
                                            'page-1',
                                            'page-2',
                                            'page-3',
                                            'page-4',
                                        ].map((q, i) => {
                                            return (
                                                <StyledSheet
                                                    key={i}
                                                    selected={true}
                                                    onClick={(e) => {
                                                        console.log(
                                                            'select page',
                                                        );
                                                    }}
                                                >
                                                    <Typography
                                                        variant={'body2'}
                                                        fontWeight="bold"
                                                        sx={{
                                                            textOverflow:
                                                                'ellipsis',
                                                            whiteSpace:
                                                                'nowrap',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        {q}
                                                    </Typography>
                                                    <IconButton
                                                        size={'small'}
                                                        onClick={(
                                                            event: React.MouseEvent<HTMLElement>,
                                                        ) => {
                                                            console.log(
                                                                'what do you want to do',
                                                            );
                                                        }}
                                                    >
                                                        <MoreVert />
                                                    </IconButton>
                                                </StyledSheet>
                                            );
                                        })}
                                        {/* MORE OPTIONS */}
                                    </StyledStack>
                                    <StyledButtonContainer>
                                        <StyledIconButton
                                            size="small"
                                            onClick={() => {
                                                console.log('add page block');
                                            }}
                                        >
                                            <Icon color="primary">
                                                <Add />
                                            </Icon>
                                        </StyledIconButton>
                                    </StyledButtonContainer>
                                </Stack>
                            </Stack>
                            <Screen>
                                <ErrorBoundary title={'Something went wrong!'}>
                                    <Renderer id={designer.rendered} />
                                </ErrorBoundary>
                            </Screen>
                        </div>
                    }
                    // middle={
                    //     <div
                    //         style={{
                    //             width: '100%',
                    //             height: '100%',
                    //             display: 'flex',
                    //             flexDirection: 'column',
                    //         }}
                    //     >
                    //         <Stack>
                    //             <div>hey</div>
                    //             <div>middle</div>
                    //         </Stack>
                    //     </div>
                    // }
                    // right={
                    //     <div
                    //         style={{
                    //             width: '100%',
                    //             height: '100%',
                    //             display: 'flex',
                    //             flexDirection: 'column',
                    //         }}
                    //     >
                    //         right
                    //     </div>
                    // }

                    right={<Notebook />}
                />
            )}
        </div>
    );
});
