import { TOKEN_TYPE_TEXT, INPUT_TYPE_DISPLAY } from '../../prompt.constants';
import { Token } from '../../prompt.types';
import { StyledTooltip } from '../../prompt.styled';
import { Typography } from '@semoss/ui';
import { PromptTokenChip } from './PromptTokenChip';
import { PromptTokenTextButton } from './PromptTokenTextButton';

export const PromptHoverToken = (props: {
    token: Token;
    tokenInputType: string | undefined;
}) => {
    return (
        <>
            {props.token.isHiddenPhraseInputToken ? (
                <></>
            ) : props.token.type === TOKEN_TYPE_TEXT ? (
                <PromptTokenTextButton key={props.token.index} disableHover>
                    {props.token.display}
                </PromptTokenTextButton>
            ) : (
                <StyledTooltip
                    title={
                        <Typography variant="body1" sx={{ marginX: 1 }}>
                            {INPUT_TYPE_DISPLAY[props.tokenInputType]}
                        </Typography>
                    }
                >
                    <span>
                        <PromptTokenChip
                            isChipSelected={false}
                            key={props.token.index}
                            label={`{ } ${props.token.display}`}
                            size="small"
                            disableHover
                        />
                    </span>
                </StyledTooltip>
            )}
        </>
    );
};
