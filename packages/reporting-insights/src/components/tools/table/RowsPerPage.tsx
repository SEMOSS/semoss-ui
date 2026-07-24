import { Input } from "@/components/ui";
import { ResetButton } from "../shared/ResetButton";

interface RowsPerPageProps {
	/** Current value. Empty string is permitted while editing; rejected on save. */
	value?: number | "";
	onChange: (value: number | "") => void;
	onReset: () => void;
}

/**
 * Initial rows-per-page for a table. Any positive number is allowed; the field may
 * be cleared (empty) while editing, but saving with it empty is blocked by the
 * dashboard save validation. Viewers can still change rows-per-page in the footer.
 */
const MAX_PAGE = 1000; // page size = rows pulled per DB call; capped so calls stay small

export function RowsPerPage({ value, onChange, onReset }: RowsPerPageProps) {
	const isEmpty = value === "" || value === undefined;
	const invalid =
		value === "" ||
		(typeof value === "number" &&
			(!Number.isFinite(value) || value <= 0 || value > MAX_PAGE));
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-2">
				<span className="text-stone-500 text-xs">Rows per page</span>
				<Input
					type="number"
					min={1}
					max={MAX_PAGE}
					step={1}
					value={value ?? ""}
					placeholder="50"
					onChange={(e) => {
						const raw = e.target.value;
						if (raw === "")
							onChange(""); // allow clearing while editing
						else
							onChange(
								Math.min(
									MAX_PAGE,
									Math.max(1, Math.floor(Number(raw))),
								),
							);
					}}
					className={`w-24 rounded-md border px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 ${
						invalid
							? "border-red-300 focus:ring-red-500/20"
							: "border-stone-200 focus:border-indigo-400 focus:ring-indigo-500/20"
					}`}
				/>
			</div>
			{invalid ? (
				<p className="text-[11px] text-red-500">
					Enter a number between 1 and {MAX_PAGE.toLocaleString()}.
					You can’t save the dashboard while this is empty or out of
					range.
				</p>
			) : (
				<p className="text-stone-500 text-xs">
					The page size the table opens with
					{isEmpty ? " (defaults to 50)" : ""} — also the rows pulled
					per database call (max {MAX_PAGE.toLocaleString()}). “Load
					more” keeps fetching another page. Viewers can change this
					in the table footer.
				</p>
			)}
			<div className="pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
