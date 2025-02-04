import { useEffect, useMemo, useRef, useState, lazy, MouseEvent } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { getValueByPath } from '@/utility';
import { Block, BlockDef, QueryState } from '@/stores';
import { DefaultBlocks } from '@/components/block-defaults';
import { Box, Button, Popover, Stack } from '@semoss/ui';

interface ColorPalatteSettingProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;
    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
    /**
     * Height of ColorPalatte
     */
    height: string;
    /**
     * Width of ColorPalatte
     */
    width: string;
}

export const ColorPalatteSettings = observer<ColorPalatteSettingProps>(
    ({ id, path, height, width }) => {
        const [showPopover, setShowPopover] =
            useState<HTMLButtonElement | null>(null);
        function handleClick(event: MouseEvent<HTMLButtonElement>) {
            setShowPopover(event.currentTarget);
        }
        function handleClose() {
            setShowPopover(null);
        }
        const open = Boolean(showPopover);
        return (
            <div>
                <Button
                    aria-describedby={id}
                    variant="outlined"
                    onClick={handleClick}
                >
                    Click Me
                </Button>
                <Popover
                    id={id}
                    open={open}
                    anchorEl={showPopover}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                >
                    <Box
                        sx={{
                            padding: 2,
                            width: '25%',
                            maxWidth: '35%',
                        }}
                    >
                        The content of the Popover.
                    </Box>
                </Popover>
            </div>
        );
    },
);
