import { A2uiSurface, type ReactCatalogComponent } from "@a2ui/react";
import type { ActionPayload, SurfaceModel } from "@a2ui/web_core/v1_0";
import { useEffect, useRef, useState } from "react";
import type { ToolCallOutcome, ToolViewProps } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	H4,
	Muted,
	Spinner,
} from "@semoss/ui/next";
import { createA2uiProcessor } from "./a2ui-catalog";

/** An isolated surface per tool call; decisions return through the owning run's controller. */
export function A2uiToolView({
	call,
	mode,
	onRespond,
	onDecline,
}: ToolViewProps) {
	const [surface, setSurface] =
		useState<SurfaceModel<ReactCatalogComponent> | null>(null);
	const [title, setTitle] = useState("Interactive response");
	const [loadError, setLoadError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [decision, setDecision] = useState<"responded" | "dismissed" | null>(
		null,
	);
	const submitting = useRef(false);
	const serialized = JSON.stringify(call.arguments);
	const isActive =
		mode === "approval" && call.status === "pending" && !decision;
	const handlers = useRef({ isActive, onRespond });
	// The SDK owns the listener; updating callbacks must not reset the owner's form.
	useEffect(() => {
		handlers.current = { isActive, onRespond };
	}, [isActive, onRespond]);

	useEffect(() => {
		let processor:
			| ReturnType<typeof createA2uiProcessor>["processor"]
			| undefined;
		let isMounted = true;
		setLoadError(null);
		setSurface(null);
		setDecision(null);
		try {
			const result = createA2uiProcessor(
				serialized,
				(action: ActionPayload) => {
					if (
						!isMounted ||
						!handlers.current.isActive ||
						submitting.current
					)
						return;
					submitting.current = true;
					setIsSubmitting(true);
					setSubmitError(null);
					const outcome: ToolCallOutcome = {
						userAction: "a2ui-action",
						summary:
							"The owner responded to the interactive interface.",
						result: { version: "1.0", action },
					};
					void handlers.current
						.onRespond(outcome)
						.then(() => {
							if (isMounted) setDecision("responded");
						})
						.catch((error: unknown) => {
							if (isMounted)
								setSubmitError(
									error instanceof Error
										? error.message
										: "Could not save your response. Try again.",
								);
						})
						.finally(() => {
							submitting.current = false;
							if (isMounted) setIsSubmitting(false);
						});
				},
			);
			processor = result.processor;
			setTitle(result.title);
			setSurface(processor.getSurfaces().values().next().value ?? null);
		} catch (error) {
			setLoadError(
				error instanceof Error
					? error.message
					: "This interface could not be loaded.",
			);
		}
		return () => {
			isMounted = false;
			processor?.dispose();
		};
	}, [serialized]);

	const handleDismiss = async (): Promise<void> => {
		if (!isActive || submitting.current) return;
		submitting.current = true;
		setIsSubmitting(true);
		setSubmitError(null);
		try {
			await onDecline();
			setDecision("dismissed");
		} catch (error) {
			setSubmitError(
				error instanceof Error
					? error.message
					: "Could not dismiss this interface. Try again.",
			);
		} finally {
			submitting.current = false;
			setIsSubmitting(false);
		}
	};

	return (
		<section
			aria-label={title}
			aria-busy={isSubmitting}
			className="wrap-anywhere flex min-w-0 flex-col gap-4 p-4"
		>
			<H4 className="wrap-anywhere min-w-0">{title}</H4>
			{loadError ? (
				<Alert variant="destructive">
					<AlertDescription>
						This interface could not be displayed. Dismiss it and
						ask the agent to try again. {loadError}
					</AlertDescription>
				</Alert>
			) : surface && isActive ? (
				<div
					className="min-w-0 overflow-x-auto"
					inert={!isActive || isSubmitting}
				>
					<A2uiSurface surface={surface} />
				</div>
			) : !surface && isActive ? (
				<Spinner aria-label="Loading interface" />
			) : null}
			{submitError && (
				<Alert variant="destructive">
					<AlertDescription>{submitError}</AlertDescription>
				</Alert>
			)}
			{isActive ? (
				<div className="flex flex-wrap items-center gap-3">
					<Button
						type="button"
						variant="outline"
						disabled={isSubmitting}
						onClick={() => void handleDismiss()}
					>
						Dismiss
					</Button>
					{isSubmitting && (
						<output className="flex items-center gap-2">
							<Spinner />
							Saving response…
						</output>
					)}
				</div>
			) : (
				<output>
					<Muted>
						{call.status === "declined" || decision === "dismissed"
							? "Dismissed."
							: call.status === "succeeded" ||
									decision === "responded"
								? "Response sent. This interface is closed."
								: "This interface is no longer accepting responses."}
					</Muted>
				</output>
			)}
		</section>
	);
}
