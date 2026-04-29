import { Check, Copy, Terminal } from "lucide-react";
import { Children, isValidElement, useState } from "react";
import {
	CodeContainer,
	H4,
	Markdown,
	P,
	Separator,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { useEngine, usePixel } from "@/hooks";

/**
 * Wraps a fenced code block with a header bar showing the language and a
 * copy-to-clipboard button.  Defined outside EngineUsagePage so React does
 * not treat it as a new component type on every render.
 */
const CodeBlockWithCopy = ({ children }: { children: React.ReactNode }) => {
	const [copied, setCopied] = useState(false);

	const extractCodeDetails = (node: React.ReactNode) => {
		let language: string | undefined;
		let code = "";

		const walk = (child: React.ReactNode) => {
			if (typeof child === "string" || typeof child === "number") {
				code += String(child);
				return;
			}

			if (!isValidElement(child)) {
				return;
			}

			const props = child.props as {
				language?: string;
				code?: string;
				children?: React.ReactNode;
			};

			if (!language && typeof props.language === "string") {
				language = props.language;
			}

			if (typeof props.code === "string") {
				code += props.code;
				return;
			}

			if (props.children) {
				Children.forEach(props.children, walk);
			}
		};

		Children.forEach(node, walk);

		return { language, code };
	};

	const { language, code } = extractCodeDetails(children);

	const handleCopy = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy code");
		}
	};

	return (
		<div className="my-2 overflow-hidden rounded-md border border-border">
			{/* Header bar — language label left, copy button right */}
			<div className="flex items-center justify-between border-border border-b bg-muted px-3 py-1.5">
				{language && (
					<span className="font-mono text-muted-foreground text-xs">
						{language}
					</span>
				)}
				<button
					type="button"
					onClick={handleCopy}
					className="ml-auto flex items-center gap-1 rounded px-2 py-0.5 text-muted-foreground text-xs transition-colors hover:bg-background hover:text-foreground"
				>
					{copied ? (
						<>
							<Check className="size-3" />
							Copied
						</>
					) : (
						<>
							<Copy className="size-3" />
							Copy
						</>
					)}
				</button>
			</div>

			{/* Scrollable code area */}
			<div className="overflow-x-auto bg-muted/30">
				<CodeContainer className="min-w-max whitespace-pre rounded-none bg-transparent p-4">
					{children}
				</CodeContainer>
			</div>
		</div>
	);
};

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
		<div className="flex min-w-0 flex-col gap-4">
			<div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-4">
				<Terminal className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />
				<div className="flex flex-col gap-1">
					<span className="font-semibold text-sm">
						Test in the terminal
					</span>
					<P className="text-muted-foreground text-sm">
						Click{" "}
						<a
							href="../../legacy/dist/#!/embed-terminal"
							rel="noopener noreferrer"
							target="_blank"
							className="text-primary underline underline-offset-4 hover:text-primary/80"
						>
							here
						</a>{" "}
						to open the terminal and test commands interactively
					</P>
				</div>
			</div>

			<H4 className="font-semibold">API & SDK Usage</H4>
			<Separator />
			{Object.keys(GetEngineUsage.data).length === 0 ? (
				<div className="flex items-center justify-center p-8">
					<P className="text-muted-foreground">No Details</P>
				</div>
			) : (
				""
			)}
			{Object.keys(GetEngineUsage.data).map((key, index) => {
				const { code, label } = GetEngineUsage.data[key];

				if (!code) {
					return null;
				}

				return (
					<div key={key} className="flex min-w-0 flex-col gap-3">
						{index > 0 && <Separator />}
						<p className="font-semibold text-base text-foreground">
							{label}
						</p>
						<Markdown
							components={{
								pre: ({ children }) => (
									<CodeBlockWithCopy>
										{children}
									</CodeBlockWithCopy>
								),
								p: ({ children }) => (
									<p className="mt-0 text-foreground text-sm leading-relaxed">
										{children}
									</p>
								),
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
