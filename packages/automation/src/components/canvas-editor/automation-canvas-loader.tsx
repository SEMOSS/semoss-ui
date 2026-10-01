import { AlertCircle, Loader2 } from "lucide-react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle, Button } from "@semoss/ui/next";
import { fetchAutomationNodeDefinitions } from "../../api";
import {
	hasAutomationNodeDefinitions,
	setAutomationNodeDefinitions,
} from "../../domain/automation-node-catalog";
import {
	AutomationCanvasContent,
	type AutomationCanvasHandle,
	type AutomationCanvasProps,
} from "./automation-canvas";

let catalogLoadPromise: Promise<void> | null = null;

function loadNodeCatalog(): Promise<void> {
	if (hasAutomationNodeDefinitions()) return Promise.resolve();
	if (!catalogLoadPromise) {
		catalogLoadPromise = fetchAutomationNodeDefinitions()
			.then((catalog) => setAutomationNodeDefinitions(catalog.nodes))
			.catch((error: unknown) => {
				catalogLoadPromise = null;
				throw error;
			});
	}
	return catalogLoadPromise;
}

function errorMessage(error: unknown): string {
	return error instanceof Error
		? error.message
		: "The Automation node catalog could not be loaded.";
}

/** Loads the canonical backend node catalog before rendering a workflow canvas. */
export const AutomationCanvas = forwardRef<
	AutomationCanvasHandle,
	AutomationCanvasProps
>(function AutomationCanvas(props, ref) {
	const [error, setError] = useState<string | null>(null);
	const [ready, setReady] = useState(hasAutomationNodeDefinitions);
	const mountedRef = useRef(true);

	const load = useCallback(() => {
		if (hasAutomationNodeDefinitions()) {
			setReady(true);
			setError(null);
			return;
		}

		setReady(false);
		setError(null);
		void loadNodeCatalog()
			.then(() => {
				if (mountedRef.current) setReady(true);
			})
			.catch((loadError: unknown) => {
				if (mountedRef.current) setError(errorMessage(loadError));
			});
	}, []);

	useEffect(() => {
		mountedRef.current = true;
		load();
		return () => {
			mountedRef.current = false;
		};
	}, [load]);

	const retry = useCallback(() => load(), [load]);

	if (error) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<Alert variant="destructive" className="max-w-lg">
					<AlertCircle aria-hidden />
					<AlertTitle>Unable to load Automation nodes</AlertTitle>
					<AlertDescription className="space-y-3">
						<p>{error}</p>
						<Button type="button" variant="outline" onClick={retry}>
							Try again
						</Button>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	if (!ready) {
		return (
			<output
				className="flex h-full items-center justify-center gap-2 text-muted-foreground text-sm"
				aria-live="polite"
			>
				<Loader2 className="size-5 animate-spin" aria-hidden />
				Loading Automation nodes…
			</output>
		);
	}

	return <AutomationCanvasContent ref={ref} {...props} />;
});
