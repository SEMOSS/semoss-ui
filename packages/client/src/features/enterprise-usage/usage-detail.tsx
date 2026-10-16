import { Copy } from "lucide-react";
import {
	Button,
	H4,
	Muted,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	toast,
} from "@semoss/ui/next";
import { detailQuery } from "@/api/enterprise-usage-requests";
import type { UsageSelection } from "./usage.types";
import { UsagePayload } from "./usage-payload";
import { UsageState } from "./usage-state";
import { useUsageQuery } from "./use-usage-query";

/** The kinds of record the panel shows; an audit event is a change or a denied request. */
type DetailKind = "model" | "activity" | "change" | "denial";

/** The panel's title and description for each kind of record. */
const DETAIL_TEXT: Record<DetailKind, { title: string; description: string }> =
	{
		model: {
			title: "Model Message Detail",
			description:
				"Stored Content For The Selected Record. Missing Content May Reflect Retention Settings Or Disabled Prompt/Response Logging.",
		},
		activity: {
			title: "Activity Event Detail",
			description:
				"Stored Content For The Selected Record. Missing Content May Reflect Retention Settings Or Disabled Prompt/Response Logging.",
		},
		change: {
			title: "Change Detail",
			description:
				"The Change Recorded For The Selected Event: What Was There Before, What Was Set, And Its Details.",
		},
		denial: {
			title: "Denied Request Detail",
			description:
				"Why The Selected Request Was Denied, As The Audit Trail Recorded It.",
		},
	};

/** The stored fields of each kind of record but a model message, with their labels. */
const PAYLOAD_FIELDS: Record<
	Exclude<DetailKind, "model">,
	[string, string][]
> = {
	activity: [
		["MESSAGE", "Event Message"],
		["REQUEST", "Request"],
		["RESPONSE", "Response"],
	],
	change: [
		["OLD_VALUE", "Before"],
		["NEW_VALUE", "After"],
		["DETAILS", "Details"],
	],
	denial: [
		["ERROR_MESSAGE", "Reason"],
		["ERROR_CODE", "Error Code"],
	],
};

/** What kind of record a selection is, from its source and, for an audit event, its outcome. */
function detailKind(selection: UsageSelection | null): DetailKind {
	if (selection?.source === "model") return "model";
	if (selection?.source !== "audit") return "activity";
	return selection.row.STATUS === "DENIED" ? "denial" : "change";
}

interface UsageDetailProps {
	/** Selected event; null closes the panel and defers the body query. */
	selection: UsageSelection | null;
	/** Dismisses the selection. */
	onClose: () => void;
	/** Restores focus to the specific row button that opened this panel. */
	onReturnFocus: () => void;
}

/** Fetches retained bodies only for the selected record; renders log text without HTML execution. */
export function UsageDetail({
	selection,
	onClose,
	onReturnFocus,
}: UsageDetailProps) {
	const result = useUsageQuery(
		selection ? detailQuery(selection.source, selection.row) : null,
	);
	const kind = detailKind(selection);
	const handleCopyRecord = async (): Promise<void> => {
		if (!selection || result.isLoading || result.error) return;
		try {
			await navigator.clipboard.writeText(
				JSON.stringify(
					{
						source: selection.source,
						record: selection.row,
						content: result.rows,
					},
					null,
					2,
				),
			);
			toast.success("Record JSON Copied");
		} catch {
			toast.error("Unable To Copy Record. Check Clipboard Permissions.");
		}
	};
	return (
		<Sheet
			open={Boolean(selection)}
			onOpenChange={(isOpen) => {
				if (!isOpen) onClose();
			}}
		>
			<SheetContent
				className="w-full gap-3 overflow-y-auto sm:max-w-2xl"
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					onReturnFocus();
				}}
			>
				<SheetHeader className="pb-0">
					<SheetTitle>{DETAIL_TEXT[kind].title}</SheetTitle>
					<SheetDescription>
						{DETAIL_TEXT[kind].description}
					</SheetDescription>
				</SheetHeader>
				<div className="space-y-3 px-4 pb-6">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<H4 className="text-sm">Record Metadata</H4>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={result.isLoading || Boolean(result.error)}
							onClick={handleCopyRecord}
						>
							<Copy aria-hidden="true" />
							Copy Record JSON
						</Button>
					</div>
					<dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-b pb-3">
						{Object.entries(selection?.row ?? {})
							.filter(([key]) => key !== "ROW_NUM")
							.map(([key, value]) => (
								<div key={key} className="min-w-0">
									<dt className="text-muted-foreground text-sm">
										{key
											.split("_")
											.map((word) =>
												word === "ID"
													? "ID"
													: word[0] +
														word
															.slice(1)
															.toLowerCase(),
											)
											.join(" ")}
									</dt>
									<dd className="whitespace-pre-wrap break-words text-sm">
										{value === null
											? "Not Recorded"
											: String(value)}
									</dd>
								</div>
							))}
					</dl>
					<UsageState result={result} label="Stored Content">
						{result.rows.length === 0 ? (
							<Muted>
								No Retained Content Was Found For This Record.
							</Muted>
						) : (
							result.rows.map((row, index) => (
								<div
									key={`${row.MESSAGE_ID ?? row.LOG_ID ?? row.EVENT_ID}-${row.MESSAGE_TYPE ?? index}`}
									className="min-w-0 space-y-3"
								>
									{kind === "model" ? (
										<UsagePayload
											label={
												row.MESSAGE_TYPE === "INPUT"
													? "Input / Prompt"
													: "Model Response"
											}
											value={row.MESSAGE_DATA}
										/>
									) : (
										PAYLOAD_FIELDS[kind].map(
											([key, label]) => (
												<UsagePayload
													key={key}
													label={label}
													value={row[key]}
													missingText={
														kind === "activity"
															? undefined
															: "Nothing Was Recorded."
													}
												/>
											),
										)
									)}
								</div>
							))
						)}
					</UsageState>
				</div>
			</SheetContent>
		</Sheet>
	);
}
