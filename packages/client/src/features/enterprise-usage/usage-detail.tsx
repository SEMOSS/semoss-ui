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
					<SheetTitle>
						{selection?.source === "model"
							? "Model Message Detail"
							: "Activity Event Detail"}
					</SheetTitle>
					<SheetDescription>
						Stored Content For The Selected Record. Missing Content
						May Reflect Retention Settings Or Disabled
						Prompt/Response Logging.
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
									key={`${row.MESSAGE_ID ?? row.LOG_ID}-${row.MESSAGE_TYPE ?? index}`}
									className="min-w-0 space-y-3"
								>
									{selection?.source === "model" ? (
										<UsagePayload
											label={
												row.MESSAGE_TYPE === "INPUT"
													? "Input / Prompt"
													: "Model Response"
											}
											value={row.MESSAGE_DATA}
										/>
									) : (
										["MESSAGE", "REQUEST", "RESPONSE"].map(
											(key) => (
												<UsagePayload
													key={key}
													label={
														key === "MESSAGE"
															? "Event Message"
															: key === "REQUEST"
																? "Request"
																: "Response"
													}
													value={row[key]}
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
