import React from 'react';
import { Typography, styled } from '@semoss/ui';

const StyledConsole = styled('div')({
    display: 'flex',
    flexDirection: 'column',
});

interface ConsoleProps {
    /**
     * Messages for each Cell
     */
    messages: string[];
}

export const NotebookCellConsole = (props: ConsoleProps) => {
    const { messages } = props;
    return (
        <StyledConsole>
            {messages.map((m, i) => {
                return (
                    <Typography key={`${i}-${m}`} variant="caption">
                        {m}
                    </Typography>
                );
            })}
        </StyledConsole>
    );
};
