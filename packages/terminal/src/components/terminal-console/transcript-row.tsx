import { CellOutputBlock } from "@semoss/shared";
import { Logo } from "../../assets/logos";
import type { ConsoleContext, ConsoleHistoryStep } from "../../types";

/**
 * Thin adapter: turns a `ConsoleHistoryStep` (terminal's REPL transcript
 * shape) into the generic props expected by `<CellOutputBlock>` (the shared
 * notebook-style output renderer in `@semoss/shared`). All the actual UI —
 * panels, raw/formatted toggles, copy buttons, popout modal, JSON viewer —
 * lives in the shared component so the client's notebook code-cell can use
 * the same renderer.
 */
interface TranscriptRowProps {
	step: ConsoleHistoryStep;
}

export const TranscriptRow = ({ step }: TranscriptRowProps) => {
	const isError =
		step.type === "ERROR" ||
		step.type === "INVALID_SYNTAX" ||
		(typeof step.type === "string" && step.type.indexOf("ERROR") > -1);

	return (
		<div className="border-zinc-100 border-b">
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
