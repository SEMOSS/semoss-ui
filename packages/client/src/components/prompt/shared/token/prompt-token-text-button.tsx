interface PromptTokenTextButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	disableHover: boolean;
}

export const PromptTokenTextButton = ({
	disableHover,
	className,
	...props
}: PromptTokenTextButtonProps) => (
	<button
		type="button"
		className={`border-none bg-transparent px-1 py-0 font-[inherit] text-inherit outline-inherit ${
			disableHover
				? "cursor-default"
				: "cursor-pointer hover:bg-primary/10"
		} ${className ?? ""}`}
		style={{ marginLeft: "-2px", marginRight: "-2px" }}
		{...props}
	/>
);
