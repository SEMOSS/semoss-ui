import React, { useState, useEffect } from 'react';
import {
    TOKEN_TYPE_TEXT,
    TOKEN_TYPE_INPUT,
    INPUT_TYPE_DISPLAY,
} from './prompt.constants';
import { Token } from './prompt.types';
import { blue } from '@mui/material/colors';
import { styled, Button, Chip, Typography } from '@semoss/ui';
import { Tooltip, TooltipProps } from '@mui/material';
import { tooltipClasses } from '@mui/material';
import { SaveAlt } from '@mui/icons-material';

interface HoverButtonRootProps {
    disableHover: boolean;
}
const StyledTextButton = styled('button', {
    shouldForwardProp: (prop) => prop !== 'disableHover',
})<HoverButtonRootProps>(({ disableHover }) => ({
    background: 'none',
    color: 'inherit',
    border: 'none',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: '4px',
    paddingRight: '4px',
    marginLeft: '-2px',
    marginRight: '-2px',
    font: 'inherit',
    cursor: disableHover ? 'default' : 'pointer',
    outline: 'inherit',
    '&:hover': {
        backgroundColor: disableHover ? 'unset' : blue[50],
    },
}));

interface ChipRootProps {
    isChipSelected: boolean;
    disableHover: boolean;
}
const StyledChip = styled(Chip, {
    shouldForwardProp: (prop) =>
        prop !== 'isChipSelected' && prop !== 'disableHover',
})<ChipRootProps>(({ isChipSelected, disableHover, theme }) => ({
    backgroundColor: isChipSelected ? theme.palette.primary.main : blue[50],
    color: isChipSelected ? blue[50] : theme.palette.primary.main,
    cursor: disableHover ? 'default' : 'pointer',
    fontWeight: '600',
    marginLeft: '1px',
    marginRight: '1px',
    marginBottom: '2px',
    '&:hover': {
        backgroundColor: disableHover ? blue[50] : theme.palette.primary.main,
        color: disableHover ? theme.palette.primary.main : blue[50],
    },
}));

const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: theme.palette.background.default,
        color: 'inherit',
        fontSize: theme.typography.pxToRem(12),
        border: '1px solid #dadde9',
        padding: 0,
    },
}));

export function PromptGeneratorReadonlyInputToken(props: { token: Token }) {
    return (
        <StyledChip
            isChipSelected={false}
            key={props.token.index}
            label={`{ } ${props.token.key}`}
            size="small"
            disableHover
        />
    );
}

export function PromptGeneratorHoverToken(props: {
    token: Token;
    tokenInputType: string | undefined;
}) {
    return (
        <>
            {props.token.isHiddenPhraseInputToken ? (
                <></>
            ) : props.token.type === TOKEN_TYPE_TEXT ? (
                <StyledTextButton key={props.token.index} disableHover>
                    {props.token.display}
                </StyledTextButton>
            ) : (
                <StyledTooltip
                    PopperProps={{
                        modifiers: [
                            {
                                name: 'offset',
                                options: {
                                    offset: [0, -10],
                                },
                            },
                        ],
                    }}
                    title={
                        <React.Fragment>
                            <Typography variant="body1" sx={{ marginX: 1 }}>
                                {INPUT_TYPE_DISPLAY[props.tokenInputType]}
                            </Typography>
                        </React.Fragment>
                    }
                >
                    <StyledChip
                        isChipSelected={false}
                        key={props.token.index}
                        label={`{ } ${props.token.display}`}
                        size="small"
                        disableHover
                    />
                </StyledTooltip>
            )}
        </>
    );
}

export function PromptGeneratorSetToken(props: {
    token: Token;
    selectedInputTokens: number[];
    addSelectedInputToken: (tokenIndex: number) => void;
    removeSelectedInputToken: (tokenIndex: number) => void;
    resetInputToken: (tokenIndex: number) => void;
    setSelectedTokensAsInputs: () => void;
}) {
    const [isTooltipOpen, setTooltipIsOpen] = useState(false);
    const [isPhraseInput, setPhraseInput] = useState(false);
    useEffect(() => {
        setTooltipIsOpen(
            props.selectedInputTokens.length > 0
                ? props.selectedInputTokens[0] === props.token.index
                : false,
        );
        setPhraseInput(props.selectedInputTokens.length > 1);
    }, [props.selectedInputTokens]);

    const [isTokenSelected, setTokenSelected] = useState(false);
    useEffect(() => {
        setTokenSelected(props.selectedInputTokens.includes(props.token.index));
    }, [props.selectedInputTokens]);

    return (
        <>
            {props.token.isHiddenPhraseInputToken ? (
                <></>
            ) : (
                <StyledTooltip
                    disableHoverListener
                    open={isTooltipOpen}
                    PopperProps={{
                        modifiers: [
                            {
                                name: 'offset',
                                options: {
                                    offset: [0, -10],
                                },
                            },
                        ],
                    }}
                    title={
                        <React.Fragment>
                            <Button
                                color="primary"
                                endIcon={<SaveAlt />}
                                variant="contained"
                                onClick={() =>
                                    props.setSelectedTokensAsInputs()
                                }
                            >
                                Set {isPhraseInput ? 'Phrase' : 'Word'} as Input
                            </Button>
                        </React.Fragment>
                    }
                >
                    {props.token.type === TOKEN_TYPE_TEXT &&
                    !isTokenSelected ? (
                        <StyledTextButton
                            key={props.token.index}
                            onClick={() =>
                                props.addSelectedInputToken(props.token.index)
                            }
                            disableHover={false}
                        >
                            {props.token.display}
                        </StyledTextButton>
                    ) : (
                        <StyledChip
                            disableHover={false}
                            isChipSelected={isTokenSelected}
                            key={props.token.index}
                            label={`{ } ${props.token.display}`}
                            size="small"
                            onClick={() => {
                                props.token.type === TOKEN_TYPE_INPUT
                                    ? props.resetInputToken(props.token.index)
                                    : props.removeSelectedInputToken(
                                          props.token.index,
                                      );
                            }}
                        />
                    )}
                </StyledTooltip>
            )}
        </>
    );
}
