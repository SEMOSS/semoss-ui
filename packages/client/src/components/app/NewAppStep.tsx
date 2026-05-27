import type React from "react";
import { useNavigate } from "@/hooks/useNavigate";

interface NewAppStepProps {
	children: React.ReactNode;
	/** Specfic tool for steps  */
	tool: string;
}

export const NewAppStep = (props: NewAppStepProps) => {
	const { children, tool } = props;
	const navigate = useNavigate();

	// Use full width for InsightBuilder pages, default maxWidth for others
	const containerClassName =
		tool === "Insight"
			? "flex flex-col gap-1 pb-5 h-full"
			: "flex flex-col gap-1";

	return (
		<div className={containerClassName}>
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
						Start from {props.tool}
					</span>
				</div>
				<h4 className="font-semibold text-2xl">{props.tool} Builder</h4>
			</div>
			{children}
		</div>
	);
};
