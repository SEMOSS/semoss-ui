import { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Button, Stack, TextField } from '@semoss/ui';
import { Code, KeyboardArrowDown } from '@mui/icons-material';
import { runPixel } from '@/api';
import { ActionMessages, CellComponent, Variable, CellDef } from '@/stores';

export interface LLMCellDef extends CellDef<'llm'> {
    widget: 'llm';
    parameters: {
        /**
         * Model to use
         */
        model: string;

        /**
         * what you want to ask
         */
        command: string;

        /**
         * guardrails to pass to llm
         */
        paramValues: Record<string, any>;
    };
}

const StyledContent = styled('div')(({ theme }) => ({
    width: '100%',
}));

export const LLMCell: CellComponent<LLMCellDef> = observer((props) => {
    return (
        <StyledContent>
            <TextField />
            <TextField />
            <TextField />
        </StyledContent>
    );
});
