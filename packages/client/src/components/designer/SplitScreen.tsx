import React, { useState, useRef, useCallback } from 'react';
import { IconButton, Stack, styled } from '@semoss/ui';
import { Box } from '@mui/material';
import {
    KeyboardDoubleArrowLeft,
    KeyboardDoubleArrowRight,
} from '@mui/icons-material';

const StyledBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    height: '100%',
    width: '100%',
    position: 'relative',
    userSelect: 'none',
}));

const StyledPane = styled(Box)(() => ({
    position: 'relative',
    // overflow: 'scroll',
    // padding: '16px'
    // border: 'solid blue',
}));

const StyledDivider = styled(Box)(({ theme }) => ({
    width: '2px',
    backgroundColor: theme.palette.divider,
    cursor: 'col-resize',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
    userSelect: 'none',
}));

const SidewaysText = styled(Box)({
    writingMode: 'vertical-rl',
    textOrientation: 'mixed',
    transform: 'rotate(180deg)',
    whiteSpace: 'nowrap',
    position: 'absolute',
    top: '36px',
});

const FIRST_DIVIDER = 15; // First pane with settings is not collapsible for now
const MIN_PANE_WIDTH = 3; // Minimum width in percentage

export const SplitScreen = ({ left, middle, right }) => {
    const [isDragging, setIsDragging] = useState(null);
    const [dividerPositions, setDividerPositions] = useState([
        FIRST_DIVIDER,
        55,
    ]);
    const containerRef = useRef(null);

    const handleMouseDown = useCallback(
        (index) => (e) => {
            e.preventDefault();
            setIsDragging({
                index,
                initialMouseX: e.clientX,
                initialDividerPosition: dividerPositions[index],
            });
        },
        [dividerPositions],
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(null);
    }, []);

    const handleMouseMove = useCallback(
        (e) => {
            if (isDragging !== null && containerRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                const mouseDelta = e.clientX - isDragging.initialMouseX;
                const deltaPct = (mouseDelta / containerWidth) * 100;
                const newPosition =
                    isDragging.initialDividerPosition + deltaPct;

                setDividerPositions((prevPositions) => {
                    const newPositions = [...prevPositions];
                    const index = isDragging.index;

                    // TODO: Allow collapse for first pane
                    if (index === 0) {
                        // newPositions[0] = Math.min(
                        //     Math.max(newPosition, MIN_PANE_WIDTH),
                        //     newPositions[1] - MIN_PANE_WIDTH,
                        // );
                    } else {
                        newPositions[1] = Math.min(
                            Math.max(
                                newPosition,
                                newPositions[0] + MIN_PANE_WIDTH,
                            ),
                            100 - MIN_PANE_WIDTH,
                        );
                    }

                    return newPositions;
                });
            }
        },
        [isDragging],
    );

    const handleCollapse = (paneIndex) => {
        setDividerPositions((prevPositions) => {
            let newPositions = [...prevPositions];

            if (paneIndex === 0) {
                // TODO: Allow collapse of first pane
            } else if (paneIndex === 1) {
                newPositions = [FIRST_DIVIDER, 100 - MIN_PANE_WIDTH];
            } else if (paneIndex === 2) {
                newPositions = [FIRST_DIVIDER, FIRST_DIVIDER + MIN_PANE_WIDTH];
            }

            return newPositions;
        });
    };

    /**
     * percentage width of the panel based on positions of dividers
     * @param index
     * @returns
     */
    const getPaneWidth = (index) => {
        if (index === 0) return `${dividerPositions[0]}%`;
        if (index === 1) return `${dividerPositions[1] - dividerPositions[0]}%`;
        return `${100 - dividerPositions[1]}%`;
    };

    /**
     *
     * @param index
     * @returns
     */
    const isMinWidth = (index) => {
        if (index === 1) {
            return dividerPositions[1] - dividerPositions[0] <= MIN_PANE_WIDTH;
        } else if (index === 2) {
            return 100 - dividerPositions[1] <= MIN_PANE_WIDTH;
        }
    };

    return (
        <StyledBox
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <StyledPane sx={{ width: getPaneWidth(0) }}>
                {/* {JSON.stringify(dividerPositions)} */}
                {left}
            </StyledPane>
            <StyledDivider
                onMouseDown={handleMouseDown(0)}
                sx={{ width: '1px' }}
            />
            <StyledPane sx={{ width: getPaneWidth(1) }}>
                {/* TODO: Refactor */}
                {isMinWidth(1) ? (
                    <Stack
                        sx={{ width: '100%' }}
                        alignContent={'center'}
                        justifyContent={'center'}
                    >
                        <IconButton
                            onClick={() => {
                                handleCollapse(1);
                            }}
                        >
                            <KeyboardDoubleArrowLeft />
                        </IconButton>
                        <SidewaysText>Design</SidewaysText>
                    </Stack>
                ) : (
                    <div style={{ position: 'relative' }}>
                        <IconButton
                            sx={{ position: 'absolute', top: 0, right: 0 }}
                            onClick={() => {
                                handleCollapse(1);
                            }}
                        >
                            <KeyboardDoubleArrowRight />
                        </IconButton>
                        {middle}
                    </div>
                )}
                {/* {middle} */}
            </StyledPane>
            <StyledDivider onMouseDown={handleMouseDown(1)} />
            <StyledPane sx={{ width: getPaneWidth(2) }}>
                {/* TODO: Refactor */}
                {isMinWidth(2) ? (
                    <Stack
                        sx={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        <IconButton
                            sx={{ position: 'absolute', top: 0, right: 0 }}
                            onClick={() => {
                                handleCollapse(2);
                            }}
                        >
                            <KeyboardDoubleArrowRight />
                        </IconButton>
                        <SidewaysText>Notebook</SidewaysText>
                    </Stack>
                ) : (
                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        {React.cloneElement(right, {
                            collapseComponent: (
                                <IconButton
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                    }}
                                    onClick={() => {
                                        handleCollapse(2);
                                    }}
                                >
                                    <KeyboardDoubleArrowLeft />
                                </IconButton>
                            ),
                        })}
                    </div>
                )}
            </StyledPane>
        </StyledBox>
    );
};
