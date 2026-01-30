import {
	CodeContainer,
	H4,
	Markdown,
	P,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { useEngine, usePixel } from "@/hooks";

/**
 * Wrap the Database, Storage, Model routes
 */
export const EngineUsagePage = () => {
	// get the database information
	const { active } = useEngine();

	// get the engine info
	const GetEngineUsage = usePixel<{
		code: string;
		label: string;
		type: string;
	}>(`GetEngineUsage(engine=["${active.id}"]);`);

	/**
	 * Copy text and add it to the clipboard
	 * @param text - text to copy
	 */
	const _copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);

			toast.success("Code copied to clipboard");
		} catch (_e) {
			toast.error("Failed to copy code to clipboard");
		}
	};

	// show a loading screen when it is pending
	if (GetEngineUsage.status !== "SUCCESS") {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<Spinner className="size-8" />
				<P className="text-muted-foreground">Loading Usage</P>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<H4 className="font-normal">Test in the terminal</H4>
			<P>
				Click{" "}
				<a
					href="../../legacy/dist/#!/embed-terminal"
					rel="noopener noreferrer"
					target="_blank"
					className="text-primary underline underline-offset-4 hover:text-primary/80"
				>
					here
				</a>{" "}
				to go to the terminal and test the commands
			</P>

			<H4 className="font-normal">Use in Code</H4>
			{Object.keys(GetEngineUsage.data).length === 0 ? (
				<div className="flex items-center justify-center p-8">
					<P className="text-muted-foreground">No Details</P>
				</div>
			) : (
				""
			)}
			{Object.keys(GetEngineUsage.data).map((key) => {
				const { code, label } = GetEngineUsage.data[key];

				if (!code) {
					return null;
				}

				return (
					<div key={key} className="flex flex-col gap-2">
						<P className="font-semibold">{label}</P>
						<Markdown
							components={{
								pre: ({ children }) => {
									return (
										<CodeContainer>
											{children}
										</CodeContainer>
									);
								},
							}}
						>
							{code}
						</Markdown>
					</div>
				);
			})}
		</div>
	);
};
