import { RefreshCw, TextCursorInput } from "lucide-react";
import { useEffect, useState } from "react";
import { TOKEN_TYPE_INPUT, TOKEN_TYPE_TEXT } from "../../prompt.constants";
import { StyledTooltip } from "../../prompt.styled";
import type { Token } from "../../prompt.types";
import { PromptTokenChip } from "./prompt-token-chip";
import { PromptTokenTextButton } from "./prompt-token-text-button";

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
	// biome-ignore lint/correctness/useExhaustiveDependencies: props.token.index is stable per token instance
	useEffect(() => {
		setTooltipIsOpen(
			props.selectedInputTokens.length > 0
				? props.selectedInputTokens[0] === props.token.index
				: false,
		);
	}, [props.selectedInputTokens]);

	const [isTokenSelected, setTokenSelected] = useState(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: props.token.index is stable per token instance
	useEffect(() => {
		setTokenSelected(props.selectedInputTokens.includes(props.token.index));
	}, [props.selectedInputTokens]);

	return props.token.isHiddenPhraseInputToken ? null : (
		<StyledTooltip
			disableBorder
			disableHoverListener
			open={isTooltipOpen}
			title={
				<div className="flex flex-col overflow-hidden rounded border border-primary">
					{props.isSelectedLinkable !== false && (
						<button
							type="button"
							className="flex w-full items-center gap-1.5 rounded-none border-primary border-b px-3 py-1.5 text-sm hover:bg-accent"
							onClick={() =>
								props.setSelectedTokensAsInputs(true)
							}
						>
							<RefreshCw className="h-3.5 w-3.5" />
							Link Input
						</button>
					)}
					<button
						type="button"
						className="flex w-full items-center gap-1.5 rounded-none px-3 py-1.5 text-sm hover:bg-accent"
						onClick={() => props.setSelectedTokensAsInputs()}
					>
						<TextCursorInput className="h-3.5 w-3.5" />
						Set Input
					</button>
				</div>
			}
		>
			<span>
				{props.token.type === TOKEN_TYPE_TEXT && !isTokenSelected ? (
					<PromptTokenTextButton
						key={props.token.index}
						onClick={() => {
							props.addSelectedInputToken(props.token.index);
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
								? props.resetInputToken(props.token.index)
								: props.removeSelectedInputToken(
										props.token.index,
									);
						}}
					/>
				)}
			</span>
		</StyledTooltip>
	);
};
