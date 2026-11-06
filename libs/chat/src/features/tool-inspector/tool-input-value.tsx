import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Button, cn } from "@semoss/ui/next";
import { isRecord } from "@semoss/utility/object";

interface ToolInputValueProps {
	/** A raw parameter or nested value. */
	value: unknown;
	/** Omit the name for the root parameter collection. */
	name?: string;
	/** Optional schema supplies field titles and descriptions. */
	schema?: unknown;
}

const PAGE_SIZE = 50;
const PREVIEW_LENGTH = 300;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	isRecord(value) ? (value as Record<string, unknown>) : undefined;

/** A readable field row; nested values and long text expand only on demand. */
export const ToolInputValue = ({
	value,
	name,
	schema,
}: ToolInputValueProps) => {
	const { t } = useTranslation("tool");
	const [isOpen, setIsOpen] = useState(false);
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
	const [isTextExpanded, setIsTextExpanded] = useState(false);
	const isArray = Array.isArray(value);
	const record = asRecord(value);
	const isCollection = isArray || !!record;
	const entryCount = isArray
		? value.length
		: Object.keys(record ?? {}).length;
	const entries = isArray
		? value
				.slice(0, visibleCount)
				.map((item, index) => [String(index), item] as const)
		: Object.entries(record ?? {}).slice(0, visibleCount);
	const definition = asRecord(schema);
	const properties = asRecord(definition?.properties);
	const label =
		typeof definition?.title === "string"
			? definition.title
			: name
					?.replace(/([a-z\d])([A-Z])/g, "$1 $2")
					.replace(/[_-]+/g, " ")
					.replace(/^./, (letter) => letter.toUpperCase());
	const description =
		typeof definition?.description === "string"
			? definition.description
			: undefined;
	const isLongText =
		typeof value === "string" && value.length > PREVIEW_LENGTH;
	const isBlockText =
		typeof value === "string" &&
		(value.length > 120 || value.includes("\n"));
	const collection = () => (
		<>
			<dl className="min-w-0 divide-y divide-border/60">
				{entries.map(([key, item]) => (
					<ToolInputValue
						key={key}
						name={key}
						value={item}
						schema={isArray ? definition?.items : properties?.[key]}
					/>
				))}
			</dl>
			{entryCount > visibleCount && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="my-1 h-auto min-h-8 max-w-full whitespace-normal text-start"
					onClick={() =>
						setVisibleCount((count) => count + PAGE_SIZE)
					}
				>
					{t("inspector.showMore", {
						remaining: entryCount - visibleCount,
					})}
				</Button>
			)}
		</>
	);

	if (name === undefined) {
		return entries.length ? (
			collection()
		) : (
			<p className="p-3 text-muted-foreground text-sm">
				{t("form.noParameters")}
			</p>
		);
	}

	if (isCollection) {
		return (
			<div className="min-w-0 px-3 py-1 text-sm">
				<dt className="sr-only">{label}</dt>
				<dd>
					<details
						open={isOpen}
						onToggle={(event) =>
							setIsOpen(event.currentTarget.open)
						}
					>
						<summary
							className="cursor-pointer break-words rounded-sm py-2 focus-visible:outline-ring"
							title={name}
						>
							<span>{label}</span>
							<span className="ms-2 text-muted-foreground text-xs">
								{t(
									isArray
										? "inspector.itemCount"
										: "inspector.fieldCount",
									{ total: entryCount },
								)}
							</span>
						</summary>
						{isOpen && (
							<div className="min-w-0 border-s ps-1">
								{description && (
									<p className="px-3 py-1 text-muted-foreground text-xs">
										{description}
									</p>
								)}
								{collection()}
							</div>
						)}
					</details>
				</dd>
			</div>
		);
	}

	return (
		<div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start gap-x-3 gap-y-1 px-3 py-2 text-sm">
			<dt
				className={cn(
					"min-w-0 break-words text-muted-foreground",
					isBlockText && "col-span-2",
				)}
				title={name}
			>
				{label}
				{description && <p className="mt-1 text-xs">{description}</p>}
			</dt>
			<dd className={cn("min-w-0", isBlockText && "col-span-2")}>
				{typeof value === "boolean" ? (
					<span className="inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
						{String(value)}
					</span>
				) : value === null || value === undefined ? (
					<span className="font-mono text-muted-foreground text-xs">
						{String(value)}
					</span>
				) : value === "" ? (
					<span className="text-muted-foreground text-xs italic">
						{t("inspector.emptyString")}
					</span>
				) : (
					<>
						<div
							className="max-h-64 overflow-auto whitespace-pre-wrap break-words"
							dir="auto"
						>
							{isLongText && !isTextExpanded
								? `${value.slice(0, PREVIEW_LENGTH)}…`
								: String(value)}
						</div>
						{isLongText && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="mt-1 h-auto min-h-8 max-w-full whitespace-normal px-2 text-xs"
								aria-expanded={isTextExpanded}
								onClick={() =>
									setIsTextExpanded((expanded) => !expanded)
								}
							>
								{t(
									isTextExpanded
										? "inspector.showLess"
										: "inspector.showFullValue",
								)}
							</Button>
						)}
					</>
				)}
			</dd>
		</div>
	);
};
