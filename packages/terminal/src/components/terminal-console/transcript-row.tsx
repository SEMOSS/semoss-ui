import { CellOutputBlock } from "@semoss/shared";
import { Logo } from "../../assets/logos";
import type { ConsoleContext, ConsoleHistoryStep } from "../../types";

interface TranscriptRowProps {
	step: ConsoleHistoryStep;
}

export const TranscriptRow = ({ step }: TranscriptRowProps) => {
	const isError =
		step.type === "ERROR" ||
		step.type === "INVALID_SYNTAX" ||
		(typeof step.type === "string" && step.type.indexOf("ERROR") > -1);

	return (
		<div className="border-border border-b">
			<CellOutputBlock
				prompt={{
					icon: (
						<Logo
							name={step.context as ConsoleContext}
							className="h-4 w-4"
						/>
					),
					text: step.input,
				}}
				output={step.output}
				logs={step.messages}
				pending={step.pending}
				error={isError}
			/>
		</div>
	);
};
