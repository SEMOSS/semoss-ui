import { INPUT_TYPE_DISPLAY, TOKEN_TYPE_TEXT } from "../../prompt.constants";
import { StyledTooltip } from "../../prompt.styled";
import type { Token } from "../../prompt.types";
import { PromptTokenChip } from "./prompt-token-chip";
import { PromptTokenTextButton } from "./prompt-token-text-button";

export const PromptHoverToken = (props: {
	token: Token;
	tokenInputType: string | undefined;
}) => {
	if (props.token.isHiddenPhraseInputToken) return null;

	if (props.token.type === TOKEN_TYPE_TEXT) {
		return (
			<PromptTokenTextButton key={props.token.index} disableHover>
				{props.token.display}
			</PromptTokenTextButton>
		);
	}

	return (
		<StyledTooltip
			title={
				<span className="mx-1 text-sm">
					{props.tokenInputType
						? (INPUT_TYPE_DISPLAY as Record<string, string>)[
								props.tokenInputType
							]
						: ""}
				</span>
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
	);
};
