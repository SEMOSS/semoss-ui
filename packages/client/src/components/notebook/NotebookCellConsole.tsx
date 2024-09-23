import React from 'react';
import { JsonViewer } from '@textea/json-viewer';
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
    const isOutputJSON = (str: string) => {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    };
    return (
        <StyledConsole>
            {messages.map((m, i) => {
                if (isOutputJSON(m)) {
                    return (
                        <JsonViewer
                            key={`${i}-${m}`}
                            value={JSON.parse(m)}
                            displayDataTypes={true}
                            displaySize={true}
                            displayComma={true}
                            rootName={false}
                        />
                    );
                } else {
                    return (
                        <Typography key={`${i}-${m}`} variant="caption">
                            {m}
                        </Typography>
                    );
                }
            })}
        </StyledConsole>
    );
};
