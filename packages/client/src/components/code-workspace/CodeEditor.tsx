import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Refresh } from '@mui/icons-material';
import { styled, ThemeProvider, IconButton } from '@semoss/ui';

import { useWorkspace } from '@/hooks';

import { CodeRenderer } from './CodeRenderer';
import { CodeViewPanel } from './CodeViewPanel';

// Styles --------------------------------------*

const StyledTopPanel = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    width: '100%',
}));

const StyledLeftPanel = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
}));

const StyledRightPanel = styled('div')(() => ({
    position: 'relative',
}));

const StyledVertDivider = styled('div')(({ theme }) => ({
    minWidth: theme.spacing(0.5),
    background: theme.palette.divider,
    '&:hover': {
        cursor: 'col-resize',
    },
}));

const StyledRendererContainer = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    width: '100%',
}));

const StyledRendererActions = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    height: '50px',
    backgroundColor: theme.palette.secondary.light,
}));

const StyledIconButton = styled(IconButton)(() => ({
    color: '#0000008A',
    height: '50px',
    width: '50px',
    fontSize: 'inherit',
}));

export const CodeEditor = observer(() => {
    // App ID Needed for pixel calls
    const { workspace } = useWorkspace();
    const [transparentOverlay, setTransparentOverlay] = useState(false);

    // temporary fix for dead refresh button should be removed
    const [counter, setCounter] = useState(0);

    /**
     * Resizing of Panels Code
     */
    const [editorView, setEditorView] = useState<
        'settings' | 'permissions' | 'code-editor'
    >('code-editor');
    const [leftPanelWidth, setLeftPanelWidth] = useState('50%');
    const [rightPanelWidth, setRightPanelWidth] = useState('50%');

    const handleHorizontalResize = (e) => {
        const containerWidth = window.innerWidth;
        const rightContainerWidth =
            ((containerWidth - e.clientX) / containerWidth) * 100;
        const leftContainerWidth = (e.clientX / containerWidth) * 100;

        const newRightPanelWidthPercentage = `${rightContainerWidth}%`;
        const newLeftPanelWidthPercentage = `${leftContainerWidth}%`;

        const parsedLeftPanelWidth = Math.floor(leftContainerWidth);
        // Prevent Code Editor from being resized to small
        if (editorView === 'code-editor' && parsedLeftPanelWidth < 15) {
            return;
        }
        // Transparency Overlay allows dragging over iframe and removal of event listener
        setTransparentOverlay(true);

        setLeftPanelWidth(newLeftPanelWidthPercentage);
        setRightPanelWidth(newRightPanelWidthPercentage);
    };

    return (
        <StyledTopPanel>
            <StyledLeftPanel sx={{ width: leftPanelWidth }}>
                {/* Left Panel for Editor Mode, should be Dark Mode */}
                <ThemeProvider reset={true} type={'light'}>
                    <CodeViewPanel
                        width={leftPanelWidth}
                        editorView={editorView}
                    />
                    <StyledVertDivider
                        onMouseDown={(e) => {
                            e.preventDefault();
                            window.addEventListener(
                                'mousemove',
                                handleHorizontalResize,
                            );
                            window.addEventListener('mouseup', () => {
                                window.removeEventListener(
                                    'mousemove',
                                    handleHorizontalResize,
                                );
                                setTransparentOverlay(false);
                            });
                        }}
                    />
                </ThemeProvider>
            </StyledLeftPanel>
            {/* Right Panel that Renders our App */}
            <StyledRightPanel sx={{ width: rightPanelWidth }}>
                {/* Allows you to drag over the iframe, if you remove this resizing is buggy */}
                {transparentOverlay ? (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            top: '0',
                            left: '0',
                            opacity: '0.8',
                            zIndex: 9999,
                        }}
                    ></div>
                ) : null}
                <StyledRendererContainer>
                    <StyledRendererActions>
                        <StyledIconButton
                            size={'small'}
                            color={'secondary'}
                            title={'Refresh'}
                            onClick={() => {
                                // refreshApp();
                                setCounter(counter + 1);
                            }}
                        >
                            <Refresh />
                        </StyledIconButton>
                    </StyledRendererActions>
                    <CodeRenderer appId={workspace.appId} key={counter} />
                </StyledRendererContainer>
            </StyledRightPanel>
        </StyledTopPanel>
    );
});
