import { Info, Terminal } from "lucide-react";
import { useMemo } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	H4,
	Markdown,
	MarkdownDocumentTitle,
	P,
	Separator,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { useEngine } from "@/hooks";

/** One usage channel returned by `GetEngineUsage`. */
interface UsageSection {
	/** Channel identifier, for example `introduction`, `pixel`, `javascript`. */
	type: string;
	/** Full heading supplied by the backend. */
	label: string;
	/** Markdown body of the channel. */
	code: string;
	/** Unique tab value, since the backend could repeat a type. */
	value: string;
}

/**
 * Short tab titles per channel. The backend `label` is a full sentence
 * ("How to use in JavaScript/TypeScript with the @semoss/sdk"), which is far
 * too long for a tab trigger, so it stays as the panel heading and these
 * drive the trigger text instead.
 */
const TAB_TITLES: Record<string, string> = {
	introduction: "Overview",
	pixel: "Pixel",
	javascript: "JavaScript",
	python: "Python",
	java: "Java",
	langchain: "LangChain",
	openai: "OpenAI",
	anthropic: "Anthropic",
	ollama: "Ollama",
};

/** Backend marker for a channel whose documentation has not been written yet. */
const PENDING_CODE = "documentation pending";

/**
 * `GetEngineUsage` returns one entry per channel. Older engine types can come
 * back as an index-keyed object rather than an array, so accept both and drop
 * anything without a body.
 */
const normalizeSections = (data: unknown): UsageSection[] => {
	if (!data || typeof data !== "object") {
		return [];
	}

	const entries = Array.isArray(data) ? data : Object.values(data);

	return entries.flatMap((entry, index) => {
		if (!entry || typeof entry !== "object") {
			return [];
		}

		const { code, label, type } = entry as Partial<UsageSection>;
		if (typeof code !== "string" || !code.trim()) {
			return [];
		}

		const resolvedType =
			typeof type === "string" && type ? type : `section-${index}`;

		return [
			{
				type: resolvedType,
				label:
					typeof label === "string" && label ? label : resolvedType,
				code,
				value: `${resolvedType}-${index}`,
			},
		];
	});
};

/** Title-case an unrecognized channel so new backend integrations still read well. */
const getTabTitle = ({ type }: UsageSection) => {
	const known = TAB_TITLES[type.toLowerCase()];
	if (known) {
		return known;
	}

	return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

/**
 * True for a placeholder channel. Engine types the backend has not documented
 * yet (guardrails, for example) come back with every channel set to this
 * marker rather than being omitted.
 */
const isPending = ({ code }: UsageSection) =>
	code.trim().toLowerCase() === PENDING_CODE;

/**
 * Wrap the Database, Storage, Model routes
 */
export const EngineUsagePage = () => {
	// get the database information
	const { engine } = useEngine();

	// get the engine info
	const GetEngineUsage = usePixel<UsageSection[]>(
		`GetEngineUsage(engine=["${engine.engine_id}"]);`,
	);

	const sections = useMemo(
		() => normalizeSections(GetEngineUsage.data),
		[GetEngineUsage.data],
	);

	// placeholder channels get their own message rather than an empty tab
	const documented = sections.filter((section) => !isPending(section));
	const hasPendingDocs =
		documented.length < sections.length &&
		documented.every(
			(section) => section.type.toLowerCase() === "introduction",
		);

	// show a loading screen when it is pending
	if (GetEngineUsage.status !== "SUCCESS") {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<Spinner />
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
							href="../../terminal/dist/"
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

			{hasPendingDocs && (
				<div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-4">
					<Info className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />
					<div className="flex flex-col gap-1">
						<span className="font-semibold text-sm">
							Usage examples are not available yet
						</span>
						<P className="text-muted-foreground text-sm">
							{documented.length > 0
								? "This engine type has not been documented yet. The overview below still covers how to reach any engine on the platform."
								: "This engine type has not been documented yet."}
						</P>
					</div>
				</div>
			)}

			{documented.length === 0 && !hasPendingDocs && (
				<div className="flex items-center justify-center p-8">
					<P className="text-muted-foreground">No Details</P>
				</div>
			)}

			{documented.length > 0 && (
				<Tabs
					key={engine.engine_id}
					defaultValue={documented[0].value}
					className="min-w-0 gap-4"
				>
					<TabsList className="h-auto flex-wrap justify-start">
						{documented.map((section) => (
							<TabsTrigger
								key={section.value}
								value={section.value}
							>
								{getTabTitle(section)}
							</TabsTrigger>
						))}
					</TabsList>

					{documented.map((section) => (
						<TabsContent
							key={section.value}
							value={section.value}
							className="flex min-w-0 flex-col gap-3"
						>
							<MarkdownDocumentTitle>
								{section.label}
							</MarkdownDocumentTitle>
							<Markdown
								className="w-full text-sm leading-relaxed"
								variant="document"
							>
								{section.code}
							</Markdown>
						</TabsContent>
					))}
				</Tabs>
			)}
		</div>
	);
};
