import { INPUT_TYPE_DISPLAY, TOKEN_TYPE_TEXT } from "../../prompt.constants";
import { StyledTooltip } from "../../prompt.styled";
import type { Token } from "../../prompt.types";
import { PromptTokenChip } from "./PromptTokenChip";
import { PromptTokenTextButton } from "./PromptTokenTextButton";

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
						<span className="mx-2 text-base">
							{INPUT_TYPE_DISPLAY[props.tokenInputType]}
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
			)}
		</>
	);
};
