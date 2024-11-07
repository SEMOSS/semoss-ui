import React, { useEffect, useState } from 'react';
import { runPixel } from '@/api';
import { useConductor } from '@/hooks';
import { observer } from 'mobx-react-lite';
import {
    Typography,
    styled,
    TextField,
    IconButton,
    FileDropzone,
    Button,
    Box,
    Stack,
    Accordion,
} from '@semoss/ui';
import { AutoFixHigh, ExpandMore } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const StyledMessageBubble = styled(Accordion)(({ theme }) => ({
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: '12px',
    marginBottom: '20px',
    '&:before': {
        display: 'none',
    },
}));

const StyledAccordionSummary = styled(Accordion.Trigger)(({ theme }) => ({
    '& .MuiAccordionSummary-content': {
        margin: 0,
    },
}));

const StyledAccordionDetails = styled(Accordion.Content)(({ theme }) => ({}));

// interface TaskExecutionProps {}
export const TaskExecution = observer(() => {
    const { conductor } = useConductor();

    const [expanded, setExpanded] = useState(true);

    useEffect(() => {
        executeTask();
    }, []);

    const formatPrompt = () => {
        // Initialize prompt
        let prompt = '';

        // Add initial prompt
        prompt += `
        -------------------------------------------------------
        PROMPT: ${conductor.initPrompt}
        -------------------------------------------------------
        `;

        // Start context section
        prompt += `
        -------------------------------------------------------
        CONTEXT:
        `;

        // Concat subtask context
        conductor.subtasks.forEach((sT, i) => {
            prompt += `
                ---- SUBCONTEXT ${i + 1} ----
                ${sT.description} 
            `;

            Object.entries(sT.outputs).forEach((kv) => {
                const key = kv[0];
                const value = kv[1];
                prompt += `
                ${key} = ${value}
                `;
            });

            prompt += `
            ---- END OF SUBCONTEXT ${i + 1} ----
            `;
        });

        // Enclose context
        prompt += `
        -------------------------------------------------------
        `;

        return prompt;
    };

    const executeTask = async () => {
        const prompt = await formatPrompt();
        const pixel = `LLM(engine = "4acbe913-df40-4ac0-b28a-daa5ad91b172",command = "<encode>${prompt}</encode>", paramValues=[{}])`;

        const { pixelReturn, errors } = await runPixel(
            pixel,
            conductor.insightId,
        );

        const resp = pixelReturn[0].output;

        conductor.setTaskOutput(resp.response);
    };

    const handleChange = () => {
        setExpanded(!expanded);
    };

    return (
        <StyledMessageBubble expanded={expanded} onChange={handleChange}>
            <StyledAccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="task-execution-content"
            >
                <Stack direction="row" alignItems="center">
                    <AutoFixHigh sx={{ marginRight: '10px' }} />
                    <Typography variant="body1">Task Execution</Typography>
                </Stack>
            </StyledAccordionSummary>
            <StyledAccordionDetails>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {conductor.taskOutput}
                </ReactMarkdown>
            </StyledAccordionDetails>
        </StyledMessageBubble>
    );
});
