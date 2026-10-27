import { Badge, Field, FieldLabel, Markdown } from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import { metadataKeyToLabel } from "@semoss/utility/text";
import { NoDetailsEmptyState } from "@/components/common";
import { normalizeTagArray } from "@/utility";
import { CatalogTags } from "./catalog-tags";

/**
 * Normalize mixed input values into a clean string array.
 *
 * @param value Potentially array, string, or unknown metadata value.
 * @returns Trimmed string array with empty values removed.
 */
const normalizeArrayValue = (value: unknown): string[] => {
	if (Array.isArray(value)) {
		return normalizeTagArray(
			value
				.map((item) => String(item).trim())
				.filter((item) => item !== ""),
		);
	}

	if (typeof value === "string") {
		const trimmed = value.trim();
		return normalizeTagArray(trimmed === "" ? undefined : trimmed);
	}

	return [];
};

/**
 * Format a value for display, adding locale thousands separators when it is a
 * number (contextWindow, maxOutputTokens). Values that are merely numeric
 * strings are only formatted when the metakey declares input_type "number", so
 * ids, years, and version strings keep their raw text.
 *
 * @param value Raw metadata value.
 * @param isNumericField Whether the metakey is configured as a number input.
 * @returns Display string for the value.
 */
const formatDisplayValue = (value: unknown, isNumericField: boolean) => {
	const text = String(value).trim();

	if (typeof value !== "number" && !(isNumericField && /^\d+$/.test(text))) {
		return text;
	}

	const parsed = typeof value === "number" ? value : Number(text);

	return Number.isFinite(parsed) ? parsed.toLocaleString() : text;
};

/**
 * Shared placeholder for a field with no value. Every empty field
 * routes through this so the wording and type scale stay identical, including
 * the CatalogTags empty state.
 */
const EmptyValue = () => (
	<div className="text-muted-foreground text-sm">None</div>
);

interface CatalogOverviewProps {
	/** ID of the catalog */
	id: string;
	/** Keys to show in the overview */
	metaKeys: {
		display_options:
			| "input"
			| "textarea"
			| "markdown"
			| "single-checklist"
			| "multi-checklist"
			| "single-select"
			| "multi-select"
			| "single-typeahead"
			| "multi-typeahead"
			| "select-box";
		display_order: number;
		metakey: string;
		single_multi: string;
		display_values?: string;
		/** Human-authored label; falls back to a formatted metakey when absent */
		display_label?: string;
		/** Configured input type, used to format numeric values */
		input_type?: string;
	}[];
	/** Associated description */
	description: string;
	/** Associated About markdown */
	markdown: string;
	/** Markdown presentation used for the About content and markdown fields. */
	markdownVariant?: "default" | "document";
	/** Associated tags  */
	tags: string[];
	/** Associated classification  */
	dataClassification: string[];
	/** Associated data restrictions  */
	dataRestrictions: string[];
	/** Metadata, read for the configured keys beyond the ones above */
	metadata: Record<string, unknown>;
	/** Date created (UTC timestamp) */
	dateCreated: string;
	/** Date last edited (UTC timestamp) */
	dateLastEdited: string;
}

/** The keys the overview shows in their own fields, not as configured keys */
const DEDICATED_KEYS = [
	"description",
	"markdown",
	"tag",
	"data classification",
	"data restrictions",
];

/**
 * The read-only overview of a catalog entry: its About markdown, and beside it
 * the description, tags, classification, restrictions, the configured metadata
 * keys, and when it was created and updated. The metadata is edited on the
 * entry's Settings tab.
 */
export const CatalogOverview = ({
	id,
	metaKeys,
	description,
	markdown,
	markdownVariant = "default",
	tags,
	dataClassification,
	dataRestrictions,
	metadata,
	dateCreated,
	dateLastEdited,
}: CatalogOverviewProps) => {
	if (!id) {
		return <div className="text-muted-foreground">No details found</div>;
	}

	const markdownClassName =
		markdownVariant === "document"
			? "w-full text-sm leading-relaxed"
			: undefined;

	// fields already shown in their own section are left out
	const dynamicMetaKeys = metaKeys
		.filter((k) => !DEDICATED_KEYS.includes(k.metakey))
		.sort((a, b) => a.display_order - b.display_order);

	/**
	 * Render a configured metadata value according to its display type.
	 *
	 * @param rawValue The value stored for the key.
	 * @param displayOption Rendering mode from metadata configuration.
	 * @param inputType Configured input type, used to format numeric values.
	 * @returns The value's display element.
	 */
	const renderDynamicValue = (
		rawValue: unknown,
		displayOption: string,
		inputType?: string,
	) => {
		if (displayOption === "markdown") {
			return String(rawValue ?? "").trim() ? (
				<Markdown
					className={markdownClassName}
					variant={markdownVariant}
				>
					{String(rawValue)}
				</Markdown>
			) : (
				<EmptyValue />
			);
		}

		if (Array.isArray(rawValue)) {
			const arrayValue = normalizeArrayValue(rawValue);
			return arrayValue.length > 0 ? (
				<div className="flex flex-wrap gap-2">
					{arrayValue.map((tag) => (
						<Badge key={tag} variant="outline">
							{tag}
						</Badge>
					))}
				</div>
			) : (
				<EmptyValue />
			);
		}

		// Covers numbers and booleans too, not just strings, so populated
		// numeric metadata (contextWindow, maxOutputTokens) is not shown as None.
		if (rawValue !== null && rawValue !== undefined) {
			const displayValue = formatDisplayValue(
				rawValue,
				inputType === "number",
			);

			if (displayValue !== "") {
				return <div className="text-sm">{displayValue}</div>;
			}
		}

		return <EmptyValue />;
	};

	return (
		<div className="my-1 space-y-6 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(16rem,24rem)] lg:gap-x-8 lg:space-y-0">
			{markdown.trim() ? (
				<div>
					<Field>
						<Markdown
							className={markdownClassName}
							variant={markdownVariant}
						>
							{markdown}
						</Markdown>
					</Field>
				</div>
			) : (
				// self-start keeps the placeholder near the top of the row
				// instead of centering it against a tall metadata sidebar.
				<NoDetailsEmptyState
					className="self-start"
					data-testid="catalog-overview--markdown-empty"
				/>
			)}
			<div>
				<div className="space-y-6 lg:rounded-xl lg:border lg:bg-card lg:p-4">
					<Field>
						<FieldLabel>Description</FieldLabel>
						{description.trim() ? (
							<div className="text-muted-foreground text-sm">
								{description}
							</div>
						) : (
							<EmptyValue />
						)}
					</Field>

					<Field>
						<FieldLabel>Tag(s)</FieldLabel>
						<CatalogTags tags={tags} />
					</Field>

					<Field>
						<FieldLabel>Data Classification</FieldLabel>
						<CatalogTags tags={dataClassification} />
					</Field>

					<Field>
						<FieldLabel>Data Restrictions</FieldLabel>
						<CatalogTags tags={dataRestrictions} />
					</Field>

					{dynamicMetaKeys.map((meta) => (
						<Field key={meta.metakey}>
							<FieldLabel>
								{meta.display_label ||
									metadataKeyToLabel(meta.metakey)}
							</FieldLabel>
							{renderDynamicValue(
								metadata[meta.metakey],
								meta.display_options,
								meta.input_type,
							)}
						</Field>
					))}

					{dateCreated && (
						<Field>
							<FieldLabel>Created</FieldLabel>
							<div className="text-muted-foreground text-sm">
								{formatLocalDateTime(dateCreated)}
							</div>
						</Field>
					)}
					{dateLastEdited && (
						<Field>
							<FieldLabel>Updated</FieldLabel>
							<div className="text-muted-foreground text-sm">
								{formatLocalDateTime(dateLastEdited)}
							</div>
						</Field>
					)}
				</div>
			</div>
		</div>
	);
};
