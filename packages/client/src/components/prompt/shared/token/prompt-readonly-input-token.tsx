import { PromptTokenChip } from "./prompt-token-chip";

export const PromptReadonlyInputToken = (props: { tokenKey: string }) => {
	return (
		<PromptTokenChip
			isChipSelected={false}
			label={`{ } ${props.tokenKey}`}
			size="small"
			disableHover
		/>
	);
};
