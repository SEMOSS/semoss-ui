import type { ButtonHTMLAttributes } from "react";

interface PromptTokenTextButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement> {
	disableHover: boolean;
}

export const PromptTokenTextButton = ({
	disableHover,
	className,
	style,
	...rest
}: PromptTokenTextButtonProps) => {
	return (
		<button
			type="button"
			className={`border-none bg-transparent px-1 -mx-0.5 py-0 font-inherit text-inherit outline-inherit ${
				disableHover ? "cursor-default" : "cursor-pointer hover:bg-[#e3f2fd]"
			} ${className ?? ""}`}
			{...rest}
		/>
	);
};
