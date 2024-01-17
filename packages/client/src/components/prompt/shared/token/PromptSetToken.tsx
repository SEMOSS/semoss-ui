import { useState, useEffect } from 'react';
import { TOKEN_TYPE_TEXT, TOKEN_TYPE_INPUT } from '../../prompt.constants';
import { Token } from '../../prompt.types';
import { StyledTooltip } from '../../prompt.styled';
import { styled, Button, List } from '@semoss/ui';
import { SaveAlt, Sync } from '@mui/icons-material';
import { PromptTokenChip } from './PromptTokenChip';
import { PromptTokenTextButton } from './PromptTokenTextButton';

const StyledListItem = styled(List.Item)(({ theme }) => ({
    padding: 0,
    border: `1px solid ${theme.palette.primary.main}`,
    '&:not(:last-child)': {
        borderBottom: '0px',
    },
}));

const StyledTooltipContentButton = styled(Button)(({ theme }) => ({
    padding: `${theme.spacing(0.5)} ${theme.spacing(1.5)}`,
    borderRadius: 0,
}));

export const PromptSetToken = (props: {
    token: Token;
    selectedInputTokens: number[];
    isSelectedLinkable: number | false;
    addSelectedInputToken: (tokenIndex: number) => void;
    removeSelectedInputToken: (tokenIndex: number) => void;
    resetInputToken: (tokenIndex: number) => void;
    setSelectedTokensAsInputs: (setAsLinked?: boolean) => void;
}) => {
    const [isTooltipOpen, setTooltipIsOpen] = useState(false);
    useEffect(() => {
        setTooltipIsOpen(
            props.selectedInputTokens.length > 0
                ? props.selectedInputTokens[0] === props.token.index
                : false,
        );
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
                    disableBorder
                    disableHoverListener
                    open={isTooltipOpen}
                    title={
                        <List disablePadding>
                            {props.isSelectedLinkable !== false ? (
                                <StyledListItem>
                                    <StyledTooltipContentButton
                                        fullWidth
                                        variant="text"
                                        startIcon={<Sync />}
                                        onClick={() =>
                                            props.setSelectedTokensAsInputs(
                                                true,
                                            )
                                        }
                                    >
                                        Link Input
                                    </StyledTooltipContentButton>
                                </StyledListItem>
                            ) : (
                                <></>
                            )}
                            <StyledListItem>
                                <StyledTooltipContentButton
                                    fullWidth
                                    variant="text"
                                    startIcon={<SaveAlt />}
                                    onClick={() =>
                                        props.setSelectedTokensAsInputs()
                                    }
                                >
                                    Set Input
                                </StyledTooltipContentButton>
                            </StyledListItem>
                        </List>
                    }
                >
                    <span>
                        {props.token.type === TOKEN_TYPE_TEXT &&
                        !isTokenSelected ? (
                            <PromptTokenTextButton
                                key={props.token.index}
                                onClick={() => {
                                    props.addSelectedInputToken(
                                        props.token.index,
                                    );
                                }}
                                disableHover={false}
                            >
                                {props.token.display}
                            </PromptTokenTextButton>
                        ) : (
                            <PromptTokenChip
                                disableHover={false}
                                isChipSelected={isTokenSelected}
                                key={props.token.index}
                                label={`{ } ${props.token.display}`}
                                size="small"
                                onClick={() => {
                                    props.token.type === TOKEN_TYPE_INPUT
                                        ? props.resetInputToken(
                                              props.token.index,
                                          )
                                        : props.removeSelectedInputToken(
                                              props.token.index,
                                          );
                                }}
                            />
                        )}
                    </span>
                </StyledTooltip>
            )}
        </>
    );
};
