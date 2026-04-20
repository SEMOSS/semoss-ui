import { CircleAlert, Copy } from "lucide-react";
import { autorun } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import {
	ActionMessages,
	type SerializedState,
	useBlocks,
} from "@semoss/renderer";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	toast,
} from "@semoss/ui/next";

/**
 * Dev Mode for the BlocksWorkspace
 */
export const BlocksWorkspaceDev = observer(() => {
	const { state } = useBlocks();

	// const json = state.toJSON();

	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [alert, setAlert] = useState<string>("");
	const [stateStr, setStateStr] = useState<string>();

	/**
	 * Validate and save the state
	 */
	const validateState = (str: string): boolean => {
		try {
			// try to parse any errors
			JSON.parse(str);

			// clear the alert
			setAlert("");

			return true;
		} catch (e) {
			// set the alert
			setAlert(e.message);

			return false;
		}
	};

	/**
	 * Try to save the state
	 */
	const updateState = (str: string) => {
		try {
			if (!validateState(str)) {
				throw new Error("a");
			}

			// try to parse any errors
			const s = JSON.parse(str) as SerializedState;

			// dispatch a message
			state.dispatch({
				message: ActionMessages.SET_STATE,
				payload: {
					state: s,
				},
			});
		} catch (e) {
			toast.error(e.message);

			// set the alert
			setAlert(e.message);
		}
	};

	/**
	 * Copy the content to the clipboard
	 * @param content - content that will be copied
	 */
	const copy = (content: string) => {
		try {
			navigator.clipboard.writeText(content);

			toast.success("Successfully copied to clipboard");
		} catch (e) {
			toast.error(e.message);
		}
	};

	/**
	 * Trigger a method on document keydown
	 */
	const onDocumentKeydown = useCallback((event: KeyboardEvent) => {
		// dev mode is ctrl + d
		if (event.key === "d" && event.ctrlKey) {
			// ignore the default action
			event.preventDefault();
			setIsOpen(true);
		}
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
	useEffect(
		() =>
			autorun(() => {
				// get the json
				const json = state.toJSON();

				// stringify it
				const str = JSON.stringify(json, null, 4);

				// update the state string
				setStateStr(str);
			}),
		[],
	);

	useEffect(() => {
		// attach the event listener
		document.addEventListener("keydown", onDocumentKeydown);

		// remove the event listener
		return () => {
			document.removeEventListener("keydown", onDocumentKeydown);
		};
	}, [onDocumentKeydown]);

	// don't open it if not necessary
	if (!isOpen) {
		return null;
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) setIsOpen(false);
			}}
		>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Dev</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-2 py-1">
					<textarea
						className="min-h-[120px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
						rows={5}
						value={stateStr}
						onChange={(e) => {
							const str = e.target.value;

							// validate
							validateState(str);

							// update
							setStateStr(str);
						}}
					/>

					<div className="flex flex-row justify-between gap-1">
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								copy(stateStr);
							}}
						>
							<Copy className="mr-1 size-4" />
							Copy
						</Button>

						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								updateState(stateStr);
							}}
						>
							<Copy className="mr-1 size-4" />
							Update
						</Button>
					</div>
					{alert && (
						<div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-destructive text-sm">
							<CircleAlert className="size-4 shrink-0" />
							<span>{alert}</span>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="ghost" onClick={() => setIsOpen(false)}>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});
