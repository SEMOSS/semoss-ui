import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import {
	Badge,
	Button,
	Field,
	FieldLabel,
	Input,
	Muted,
	P,
} from "@semoss/ui/next";
import { resultRecord, resultText, resultTitle } from "./tool-result-data";
import { ToolResultDetails } from "./tool-result-details";

interface ToolResultListProps {
	/** Only the rows returned by this call, never an independently reloaded list. */
	items: unknown[];
	title: string;
}

/** Search the returned rows and open full details without leaving the conversation. */
export function ToolResultList({ items, title }: ToolResultListProps) {
	const inputId = useId();
	const [query, setQuery] = useState("");
	const [selected, setSelected] = useState<number | null>(null);
	const returnToRow = useRef<number | null>(null);
	const focusBackButton = useCallback((button: HTMLButtonElement | null) => {
		button?.focus();
	}, []);
	const rows = items
		.map((item, index) => ({ item, index }))
		.filter(
			({ item }) =>
				!query.trim() ||
				JSON.stringify(item)
					.toLowerCase()
					.includes(query.trim().toLowerCase()),
		);
	if (selected !== null && selected < items.length) {
		return (
			<div className="min-w-0 space-y-4">
				<Button
					ref={focusBackButton}
					size="sm"
					variant="ghost"
					onClick={() => {
						returnToRow.current = selected;
						setSelected(null);
					}}
				>
					<ArrowLeft aria-hidden="true" className="size-4" />
					Back to results
				</Button>
				<ToolResultDetails value={items[selected]} />
			</div>
		);
	}
	return (
		<div className="min-w-0 space-y-3">
			{items.length > 5 && (
				<Field>
					<FieldLabel htmlFor={inputId}>
						Filter these results
					</FieldLabel>
					<div className="relative">
						<Search
							aria-hidden="true"
							className="pointer-events-none absolute start-3 top-3 size-4 text-muted-foreground"
						/>
						<Input
							id={inputId}
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search names or details"
							className="ps-9"
						/>
					</div>
				</Field>
			)}
			<output className="block text-muted-foreground text-xs">
				{rows.length} {rows.length === 1 ? "result" : "results"}
				{query ? ` of ${items.length}` : ""}
			</output>
			{rows.length ? (
				<ul aria-label={title} className="divide-y divide-border">
					{rows.map(({ item, index }) => {
						const record = resultRecord(item);
						const heading = resultTitle(item, index);
						const summary = record
							? resultText(
									record.summary ??
										record.snippet ??
										record.description ??
										record.prompt ??
										record.fromAddress ??
										record.lastAt ??
										record.createdDateTime,
								)
							: "";
						const status = record
							? resultText(
									record.status ??
										record.state ??
										(typeof record.enabled === "boolean"
											? record.enabled
												? "Enabled"
												: "Paused"
											: undefined),
								)
							: "";
						return (
							<li key={index}>
								<Button
									ref={(button) => {
										if (
											button &&
											returnToRow.current === index
										) {
											button.focus();
											returnToRow.current = null;
										}
									}}
									variant="ghost"
									className="h-auto min-h-14 w-full justify-start gap-3 rounded-md px-2 py-3 text-start"
									onClick={() => setSelected(index)}
									aria-label={`Open ${heading}`}
								>
									<div className="min-w-0 flex-1">
										<P className="line-clamp-2 whitespace-normal break-words font-medium text-sm">
											{heading}
										</P>
										{summary && (
											<Muted className="mt-1 line-clamp-2 whitespace-normal break-words text-xs">
												{summary}
											</Muted>
										)}
									</div>
									{status && (
										<Badge
											variant="outline"
											className="max-w-28 shrink-0 truncate"
										>
											{status}
										</Badge>
									)}
									<ChevronRight
										aria-hidden="true"
										className="size-4 shrink-0 text-muted-foreground"
									/>
								</Button>
							</li>
						);
					})}
				</ul>
			) : (
				<div className="py-6 text-center">
					<P className="font-medium text-sm">
						{query ? "No matching results" : "Nothing found"}
					</P>
					<Muted className="mt-1 text-sm">
						{query
							? "Try a different filter."
							: "This call returned no items."}
					</Muted>
					{query && (
						<Button
							variant="link"
							size="sm"
							onClick={() => setQuery("")}
						>
							Clear filter
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
