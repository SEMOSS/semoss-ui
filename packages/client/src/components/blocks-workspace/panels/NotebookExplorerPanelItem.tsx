import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    ContentCopyOutlined,
    DeleteOutline,
    SourceOutlined,
} from '@mui/icons-material';

import { alpha, Icon, IconButton, Stack, styled, Typography } from '@semoss/ui';

const StyledItem = styled('li', {
    shouldForwardProp: (prop) => prop !== 'isDragging' && prop !== 'isSelected',
})<{
    isDragging: boolean;
    isSelected: boolean;
}>(({ theme, isDragging, isSelected }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.spacing(4),
    width: '100%',
    padding: theme.spacing(0.5),
    gap: theme.spacing(0.5),
    opacity: isDragging ? theme.palette.action.hoverOpacity : 1,
    backgroundColor: isSelected
        ? alpha(
              theme.palette.primary.main,
              theme.palette.action.selectedOpacity,
          )
        : theme.palette.background.paper,
    cursor: 'pointer',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const StyledTypography = styled(Typography)(() => ({
    textAlign: 'left',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    flex: '1',
}));

interface NotebookExplorerItemProps {
    /**  Details */
    id: string;

    /*** Track if the item is selected*/
    isSelected: boolean;

    /** Triggered when the item is clicked*/
    onClick: (event: React.MouseEvent<HTMLLIElement>) => void;

    /** Triggered when the item starts dragging */
    onDragStart?: (event: React.DragEvent<HTMLLIElement>) => void;

    /** Triggered when the item ends dragging */
    onDragEnd?: (event: React.DragEvent<HTMLLIElement>) => void;

    /** Triggered when the item's trash icon */
    onTrashClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;

    /** Triggered when the item's copy icon */
    onCopyClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const NotebookExplorerItem: React.FC<NotebookExplorerItemProps> =
    observer((props) => {
        const {
            id,
            isSelected = false,
            onClick = () => null,
            onDragStart = () => null,
            onDragEnd = () => null,
            onTrashClick = () => null,
            onCopyClick = () => null,
        } = props;

        const [isHovered, setIsHovered] = useState(false);
        const [isDragging, setIsDragging] = useState(false);

        const name = id;

        return (
            <StyledItem
                draggable={true}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                isDragging={isDragging}
                isSelected={isSelected}
                onDragStart={(e) => {
                    setIsDragging(true);

                    // trigger the callback
                    onDragStart(e);
                }}
                onDragEnd={(e) => {
                    setIsDragging(false);

                    // trigger the callback
                    onDragEnd(e);
                }}
                onClick={(e) => {
                    // trigger the callback
                    onClick(e);
                }}
            >
                <Icon color={'disabled'} fontSize="small">
                    <SourceOutlined fontSize="inherit" />
                </Icon>
                <StyledTypography variant="body2">{name}</StyledTypography>
                {isHovered ? (
                    <Stack direction="row" alignItems={'center'} spacing={0}>
                        <IconButton
                            title={`Duplicate ${name}`}
                            onClick={(e) => {
                                // trigger
                                onCopyClick(e);
                            }}
                            size="small"
                            color={'default'}
                        >
                            <ContentCopyOutlined fontSize="inherit" />
                        </IconButton>
                        <IconButton
                            title={`Delete ${name}`}
                            onClick={(e) => {
                                // trigger
                                onTrashClick(e);
                            }}
                            size="small"
                            color={'default'}
                        >
                            <DeleteOutline fontSize="inherit" />
                        </IconButton>
                    </Stack>
                ) : null}
            </StyledItem>
        );
    });
