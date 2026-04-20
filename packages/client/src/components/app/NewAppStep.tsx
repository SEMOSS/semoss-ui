import type React from "react";
import { useNavigate } from "react-router-dom";

interface NewAppStepProps {
	children: React.ReactNode;
}

export const NewAppStep = (props: NewAppStepProps) => {
	const { children } = props;
	const navigate = useNavigate();
	return (
		<div className="flex flex-col gap-1">
			<div className="flex flex-col items-start gap-2">
				<div className="flex flex-row items-center gap-1">
					<button
						type="button"
						onClick={() => navigate("/")}
						className="cursor-pointer text-base text-foreground leading-6"
					>
						Home
					</button>
					<span className="text-base text-muted-foreground leading-6">
						/
					</span>
					<span className="text-base text-muted-foreground/60 leading-6">
						Start from prompt
					</span>
				</div>
				<h4 className="font-semibold text-2xl">Agent Builder</h4>
			</div>
			{children}
		</div>
	);
};
