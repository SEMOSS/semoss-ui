import { Search } from "lucide-react";
import { type ReactNode, useId, useRef } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Checkbox,
	cn,
	H2,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Label,
	Muted,
	P,
	Spinner,
} from "@semoss/ui/next";
import type { AppIcon } from "@/components/common/app-icons";

/** One thing that can be in the topic; checked means it is. */
export interface TopicChecklistRow {
	id: string;
	title: string;
	/** One quiet line under the title, such as who sent it and where else it is filed. */
	detail?: string;
	/** Shown at the row's end, already formatted. */
	date?: string;
	/** The source's logo, with its name for screen readers. */
	icon?: AppIcon;
	iconLabel?: string;
	isChecked: boolean;
	/** A save is on its way; the caller ignores changes until it lands. */
	isSaving?: boolean;
}

interface TopicChecklistProps {
	/** Names the list, in view above it: the folder or place it shows. */
	label: string;
	/** One line under the name saying what the rows are, so two kinds of chat are not taken for each other. */
	description: string;
	/** What the rows are, in the plural: "emails". */
	noun: string;
	searchPlaceholder: string;
	query: string;
	onQueryChange: (query: string) => void;
	rows: TopicChecklistRow[];
	onToggle: (id: string, isChecked: boolean) => void;
	/** Shows a row in the reading pane. Without it, a row's text checks its box. */
	onOpen?: (id: string) => void;
	/** The row the reading pane shows. */
	openId?: string;
	hasMore: boolean;
	/** How many more match than are listed, when that is known. */
	moreCount?: number;
	onShowMore: () => void;
	isLoading?: boolean;
	error?: string;
	onRetry?: () => void;
	/** Shown when the list is empty and nothing is searched for. */
	emptyText: string;
	/** Under the empty text: where to go to have something listed. */
	emptyAction?: ReactNode;
	/** A quiet note under the rows, such as what the list leaves out. */
	footnote?: string;
	/** What the last change did. */
	status: string;
	/** Stands in for the status until there is one; says what checking a row does by default. */
	hint?: string;
	/** Stands in for the rows, such as a sign in the list cannot be read without. */
	children?: ReactNode;
}

/**
 * A searchable list of what can be in a topic. Each change is the caller's to save as it is made, so there
 * is nothing to apply.
 */
export function TopicChecklist({
	label,
	description,
	noun,
	searchPlaceholder,
	query,
	onQueryChange,
	rows,
	onToggle,
	onOpen,
	openId,
	hasMore,
	moreCount,
	onShowMore,
	isLoading = false,
	error = "",
	onRetry,
	emptyText,
	emptyAction,
	footnote,
	status,
	hint,
	children,
}: TopicChecklistProps) {
	const fieldId = useId();
	const searchRef = useRef<HTMLInputElement>(null);
	const text = query.trim();

	return (
		<section
			aria-labelledby={`${fieldId}-label`}
			className="flex min-h-0 min-w-0 flex-1 flex-col"
		>
			<div className="shrink-0 space-y-3 border-b p-3">
				<div className="px-1">
					<H2
						id={`${fieldId}-label`}
						className="wrap-anywhere font-medium text-base leading-snug tracking-normal"
					>
						{label}
					</H2>
					<P className="text-muted-foreground text-sm">
						{description}
					</P>
				</div>
				<InputGroup>
					<InputGroupAddon>
						<Search aria-hidden="true" />
					</InputGroupAddon>
					<InputGroupInput
						ref={searchRef}
						type="search"
						aria-label={`Search ${label}`}
						placeholder={searchPlaceholder}
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</InputGroup>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto">
				{children}
				{!children && error && (
					<Alert variant="destructive" className="m-3 w-auto">
						<AlertDescription className="space-y-2">
							<P className="text-sm">{error}</P>
							{onRetry && (
								<Button
									type="button"
									size="sm"
									variant="outline"
									className="pointer-coarse:min-h-11"
									onClick={onRetry}
								>
									Try again
								</Button>
							)}
						</AlertDescription>
					</Alert>
				)}
				{!children && rows.length > 0 && (
					<ul aria-label={label} className="divide-y divide-border">
						{rows.map((row, index) => {
							const Icon = row.icon;
							const hasDetail = Boolean(
								row.detail || row.iconLabel,
							);
							const content = (
								<>
									{Icon && (
										<Icon
											aria-hidden="true"
											className="mt-0.5"
										/>
									)}
									<span className="min-w-0 flex-1">
										<span
											id={`${fieldId}-${index}-title`}
											className="wrap-anywhere line-clamp-2 font-medium"
										>
											{row.title}
										</span>
										{hasDetail && (
											<Muted
												id={`${fieldId}-${index}-detail`}
												className="wrap-anywhere line-clamp-2 font-normal text-xs leading-5"
											>
												{row.iconLabel && (
													<span className="sr-only">
														{row.iconLabel}.{" "}
													</span>
												)}
												{row.detail}
											</Muted>
										)}
									</span>
									{row.date && (
										<Muted className="shrink-0 font-normal text-xs tabular-nums leading-5">
											{row.date}
										</Muted>
									)}
								</>
							);
							return (
								<li
									key={row.id}
									className={cn(
										"flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 has-focus-visible:bg-muted/50",
										row.id === openId &&
											"bg-accent hover:bg-accent",
										row.isSaving &&
											"cursor-progress opacity-60",
									)}
								>
									<Checkbox
										id={`${fieldId}-${index}-box`}
										// a 16px box gets a 36px hit area
										className="after:-inset-2.5 relative mt-0.5 after:absolute after:content-['']"
										checked={row.isChecked}
										aria-busy={row.isSaving || undefined}
										aria-labelledby={`${fieldId}-${index}-title`}
										aria-describedby={
											hasDetail
												? `${fieldId}-${index}-detail`
												: undefined
										}
										onCheckedChange={(checked) =>
											onToggle(row.id, checked === true)
										}
									/>
									{onOpen ? (
										<Button
											type="button"
											variant="ghost"
											aria-current={
												row.id === openId || undefined
											}
											className="h-auto min-w-0 flex-1 items-start justify-start gap-3 whitespace-normal p-0 text-left font-normal leading-5 hover:bg-transparent"
											onClick={() => onOpen(row.id)}
										>
											{content}
										</Button>
									) : (
										<Label
											htmlFor={`${fieldId}-${index}-box`}
											className="min-w-0 flex-1 cursor-pointer items-start gap-3 font-normal leading-5"
										>
											{content}
										</Label>
									)}
								</li>
							);
						})}
					</ul>
				)}
				{!children && rows.length === 0 && isLoading && (
					<output className="flex items-center gap-2 p-4 text-muted-foreground text-sm">
						<Spinner aria-hidden="true" />
						Loading {noun}…
					</output>
				)}
				{!children && rows.length === 0 && !isLoading && !error && (
					<div className="flex flex-col items-start gap-3 p-4">
						<P className="text-muted-foreground text-sm">
							{text
								? `No ${noun} here match "${text}".`
								: emptyText}
						</P>
						{text && (
							<Button
								type="button"
								size="sm"
								variant="outline"
								className="pointer-coarse:min-h-11"
								onClick={() => {
									onQueryChange("");
									searchRef.current?.focus();
								}}
							>
								Clear search
							</Button>
						)}
						{!text && emptyAction}
					</div>
				)}
				{!children && hasMore && rows.length > 0 && (
					<div className="border-t p-3">
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="pointer-coarse:min-h-11"
							disabled={isLoading}
							onClick={onShowMore}
						>
							{isLoading && <Spinner className="size-4" />}
							Show more{" "}
							{moreCount !== undefined && (
								<span className="text-muted-foreground tabular-nums">
									({moreCount.toLocaleString()} left)
								</span>
							)}
						</Button>
					</div>
				)}
				{!children && footnote && rows.length > 0 && (
					<Muted className="block border-t px-4 py-3 font-normal text-xs">
						{footnote}
					</Muted>
				)}
			</div>
			{/* always there, so the first status does not move the list */}
			<output className="wrap-anywhere line-clamp-2 shrink-0 border-t px-4 py-2 text-muted-foreground text-sm">
				{status || hint || `Check ${noun} to add them to this topic.`}
			</output>
		</section>
	);
}
