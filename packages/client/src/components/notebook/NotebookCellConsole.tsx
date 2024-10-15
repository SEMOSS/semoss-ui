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
                }
                // Check used to convert "{'test': 'sample'}" string into valid JSONs
                const stringCheck = m.replace(/'/g, '"');
                if (isOutputJSON(stringCheck)) {
                    return (
                        <JsonViewer
                            key={`${i}-${stringCheck}`}
                            value={JSON.parse(stringCheck)}
                            displayDataTypes={true}
                            displaySize={true}
                            displayComma={true}
                            rootName={false}
                        />
                    );
                }

                return (
                    <Typography key={`${i}-${m}`} variant="caption">
                        {m}
                    </Typography>
                );
            })}
        </StyledConsole>
    );
};
