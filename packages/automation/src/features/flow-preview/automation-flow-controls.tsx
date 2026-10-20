import { ControlButton, Controls, useReactFlow } from "@xyflow/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

/** View controls include a keyboard and single-pointer alternative to dragging. */
export function AutomationFlowControls() {
	const flow = useReactFlow();
	const pan = (x: number, y: number): void => {
		const viewport = flow.getViewport();
		void flow.setViewport({
			...viewport,
			x: viewport.x + x,
			y: viewport.y + y,
		});
	};
	return (
		<Controls
			showInteractive={false}
			orientation="horizontal"
			position="bottom-left"
			// design-lint-disable-next-line arbitrary-size -- bounds the absolute React Flow toolbar inside its canvas, including its margin.
			className="justify-center! m-2! max-w-[calc(100%-1rem)]! flex-wrap! border-border! bg-card! text-foreground! shadow-sm! [&_button]:size-9! [&_button]:border-border! [&_button]:bg-card! [&_button]:fill-foreground! [&_button]:text-foreground! [&_button]:hover:bg-muted! [&_button]:focus-visible:outline-2! [&_button]:focus-visible:outline-ring!"
		>
			<div className="flex">
				<ControlButton
					onClick={() => pan(160, 0)}
					aria-label="Pan left"
					title="Pan left"
				>
					<ArrowLeft aria-hidden />
				</ControlButton>
				<ControlButton
					onClick={() => pan(-160, 0)}
					aria-label="Pan right"
					title="Pan right"
				>
					<ArrowRight aria-hidden />
				</ControlButton>
				<ControlButton
					onClick={() => pan(0, 160)}
					aria-label="Pan up"
					title="Pan up"
				>
					<ArrowUp aria-hidden />
				</ControlButton>
				<ControlButton
					onClick={() => pan(0, -160)}
					aria-label="Pan down"
					title="Pan down"
				>
					<ArrowDown aria-hidden />
				</ControlButton>
			</div>
		</Controls>
	);
}
