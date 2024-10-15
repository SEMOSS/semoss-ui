import { JsonViewer } from '@textea/json-viewer';
import { Typography, styled } from '@semoss/ui';
import { isOutputJSON } from '@/utility/general';

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
                const value = isOutputJSON(m);
                if (value != null) {
                    return (
                        <JsonViewer
                            key={`${i}-${m}`}
                            value={value}
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
