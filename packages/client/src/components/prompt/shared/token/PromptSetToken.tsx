import { LogIn, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@semoss/ui/next";
import { TOKEN_TYPE_INPUT, TOKEN_TYPE_TEXT } from "../../prompt.constants";
import { StyledTooltip } from "../../prompt.styled";
import type { Token } from "../../prompt.types";
import { PromptTokenChip } from "./PromptTokenChip";
import { PromptTokenTextButton } from "./PromptTokenTextButton";

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
						<div className="flex flex-col">
							{props.isSelectedLinkable !== false ? (
								<Button
									variant="ghost"
									className="w-full justify-start rounded-none border border-b-0 border-primary px-3 py-1"
									onClick={() =>
										props.setSelectedTokensAsInputs(
											true,
										)
									}
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Link Input
								</Button>
							) : (
								<></>
							)}
							<Button
								variant="ghost"
								className="w-full justify-start rounded-none border border-primary px-3 py-1"
								onClick={() =>
									props.setSelectedTokensAsInputs()
								}
							>
								<LogIn className="mr-2 h-4 w-4" />
								Set Input
							</Button>
						</div>
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
