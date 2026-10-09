import { ChevronDown, ChevronUp, Globe, RotateCcw, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
	Badge,
	Button,
	cn,
	FormCheckbox,
	FormInput,
	FormTextarea,
	H3,
	Input,
	Label,
	P,
	useFormContext,
} from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import {
	previewTopicReach,
	type ReviewPeoplePage,
	type ReviewTopic,
	searchReviewPeople,
	type TopicDraft,
	type TopicReach,
	type TopicReviewDraft,
	topicClues,
} from "./topic-review-api";

interface TopicReviewCardProps {
	actions: InsightActions;
	/** Stable source evidence from the saved review. */
	evidence?: ReviewTopic;
	/** Current form values. */
	value: TopicDraft;
	index: number;
	isSubmitting: boolean;
	onRemovePerson: (personId: string) => void;
	onRestorePerson: (personId: string) => void;
	/** Open real conversation evidence without leaving setup. */
	onInspect: (trigger: HTMLButtonElement) => void;
	inspectId: string;
	/** Keep the review compact; only one profile editor is expanded. */
	isExpanded: boolean;
	onToggle: () => void;
	onCombine: (trigger: HTMLButtonElement) => void;
}

/** Readable profile fields with independent keep selection and reversible people corrections. */
export function TopicReviewCard({
	actions,
	evidence,
	value,
	index,
	isSubmitting,
	onRemovePerson,
	onRestorePerson,
	onInspect,
	inspectId,
	isExpanded,
	onToggle,
	onCombine,
}: TopicReviewCardProps) {
	const id = useId();
	const prefix = `topics.${index}`;
	const people = evidence?.people ?? [];
	const form = useFormContext<TopicReviewDraft>();
	const [isPickerOpen, setPickerOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [offset, setOffset] = useState(0);
	const [retry, setRetry] = useState(0);
	const searchRetry = useRef(false);
	const forceReach = useRef(false);
	const [page, setPage] = useState<
		(ReviewPeoplePage & { query: string; nextOffset: number }) | null
	>(null);
	const [searchError, setSearchError] = useState("");
	const [isSearching, setSearching] = useState(false);
	const [reach, setReach] = useState<{
		key: string;
		result: TopicReach;
	} | null>(null);
	const [reachError, setReachError] = useState("");
	const [isReachLoading, setReachLoading] = useState(false);
	const [reachAttempt, setReachAttempt] = useState(0);
	const [selectedNames, setSelectedNames] = useState<Record<string, string>>(
		{},
	);
	const addedPeople = value.addedPeople ?? [];
	const selectedIds = JSON.stringify(
		[
			...new Set([
				...people
					.filter(
						(person) => !value.removedPeople.includes(person.id),
					)
					.map((person) => person.id),
				...addedPeople,
			]),
		].sort(),
	);
	// biome-ignore lint/correctness/useExhaustiveDependencies: retry explicitly repeats a failed page read.
	useEffect(() => {
		if (!isExpanded || !isPickerOpen) return;
		let active = true;
		setSearching(true);
		setSearchError("");
		const timer = setTimeout(() => {
			const refresh = searchRetry.current;
			searchRetry.current = false;
			void searchReviewPeople(actions, query.trim(), offset, refresh)
				.then((result) => {
					if (!active) return;
					setPage((previous) => ({
						...result,
						query,
						nextOffset: offset + result.items.length,
						items:
							offset && previous?.query === query
								? [
										...new Map(
											[
												...previous.items,
												...result.items,
											].map((person) => [
												person.id,
												person,
											]),
										).values(),
									]
								: result.items,
					}));
				})
				.catch((cause: unknown) => {
					if (active)
						setSearchError(
							cause instanceof Error
								? cause.message
								: "Could not search people.",
						);
				})
				.finally(() => {
					if (active) setSearching(false);
				});
		}, 300);
		return () => {
			active = false;
			clearTimeout(timer);
		};
	}, [actions, isExpanded, isPickerOpen, query, offset, retry]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: reachAttempt is the explicit refresh action.
	useEffect(() => {
		if (!isExpanded) return;
		let active = true;
		setReachLoading(true);
		setReachError("");
		const timer = setTimeout(() => {
			const refresh = forceReach.current;
			forceReach.current = false;
			void previewTopicReach(
				actions,
				JSON.parse(selectedIds) as string[],
				refresh,
			)
				.then((result) => {
					if (active) setReach({ key: selectedIds, result });
				})
				.catch((cause: unknown) => {
					if (active)
						setReachError(
							cause instanceof Error
								? cause.message
								: "Could not preview reach.",
						);
				})
				.finally(() => {
					if (active) setReachLoading(false);
				});
		}, 300);
		return () => {
			active = false;
			clearTimeout(timer);
		};
	}, [actions, isExpanded, selectedIds, reachAttempt]);
	const addPerson = (person: { id: string; name: string }): void => {
		setSelectedNames((names) => ({ ...names, [person.id]: person.name }));
		form.setValue(
			`topics.${index}.addedPeople`,
			[...new Set([...addedPeople, person.id])],
			{ shouldDirty: true },
		);
	};
	return (
		<section
			aria-labelledby={`${id}-heading`}
			className={cn(
				"min-w-0 space-y-4 rounded-xl border p-4",
				value.keep ? "border-primary/30 bg-card" : "bg-muted/30",
			)}
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<H3 id={`${id}-heading`} className="min-w-0 flex-1 text-base">
					<Button
						type="button"
						variant="ghost"
						className="h-auto min-h-11 w-full justify-start whitespace-normal px-2 text-left"
						aria-expanded={isExpanded}
						aria-controls={`${id}-editor`}
						aria-label={`Edit ${value.name || "new topic"}`}
						disabled={isSubmitting}
						onClick={onToggle}
					>
						<span className="min-w-0 flex-1 break-words">
							{value.name || "New topic"}
						</span>
						{isExpanded ? (
							<ChevronUp aria-hidden="true" />
						) : (
							<ChevronDown aria-hidden="true" />
						)}
					</Button>
				</H3>
				<FormCheckbox
					name={`${prefix}.keep`}
					label={`Keep ${value.name || "new topic"}`}
					disabled={isSubmitting || evidence?.accepted}
				/>
			</div>
			{!isExpanded && value.description && (
				<P className="line-clamp-2 break-words text-muted-foreground text-sm">
					{value.description}
				</P>
			)}
			<div id={`${id}-editor`} hidden={!isExpanded}>
				{isExpanded && (
					<div className="space-y-4 border-t pt-4">
						{evidence?.accepted && (
							<P className="text-muted-foreground text-sm">
								Already saved. You can edit its profile here and
								manage removal from Topics.
							</P>
						)}
						<FormInput
							name={`${prefix}.name`}
							label="Topic name"
							required={value.keep}
							maxLength={255}
							disabled={!value.keep || isSubmitting}
						/>
						<FormTextarea
							name={`${prefix}.description`}
							label="What this topic covers"
							rows={3}
							maxLength={12000}
							disabled={!value.keep || isSubmitting}
						/>
						<FormTextarea
							name={`${prefix}.terms`}
							label="Project names and other clues (optional)"
							description="One distinctive phrase or alias per line, such as UNC, VCU or a client project name. People can work across topics."
							rows={2}
							maxLength={4000}
							disabled={!value.keep || isSubmitting}
						/>
						{(evidence?.suggestedTerms?.length ?? 0) > 0 && (
							<div className="space-y-2">
								<P className="text-muted-foreground text-sm">
									Suggested clues
								</P>
								<div className="flex flex-wrap gap-2">
									{evidence?.suggestedTerms?.map((term) => (
										<Button
											key={term}
											type="button"
											size="sm"
											variant="outline"
											disabled={
												!value.keep ||
												isSubmitting ||
												topicClues(value.terms).some(
													(clue) =>
														clue.toLowerCase() ===
														term.toLowerCase(),
												)
											}
											onClick={() =>
												form.setValue(
													`topics.${index}.terms`,
													topicClues(
														`${value.terms}\n${term}`,
													).join("\n"),
													{
														shouldDirty: true,
														shouldValidate: true,
													},
												)
											}
										>
											Add clue: {term}
										</Button>
									))}
								</div>
							</div>
						)}
						<details className="text-sm">
							<summary className="cursor-pointer rounded-sm text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring">
								Short label:{" "}
								{value.short ||
									value.name ||
									"uses the topic name"}
							</summary>
							<FormInput
								name={`${prefix}.short`}
								label="Short label (optional)"
								description="Leave blank to use the topic name in navigation."
								maxLength={255}
								disabled={!value.keep || isSubmitting}
								className="mt-3"
							/>
						</details>
						{evidence?.reason && (
							<P className="text-muted-foreground text-sm">
								{evidence.reason}
							</P>
						)}
						{(evidence?.sampleSubjects.length ?? 0) > 0 && (
							<div className="space-y-2">
								<P className="font-medium text-sm">
									Examples behind this suggestion
								</P>
								<ul className="space-y-1 text-muted-foreground text-sm">
									{evidence?.sampleSubjects.map(
										(subject, i) => (
											<li
												key={`${i}-${subject}`}
												className="break-words"
											>
												{subject}
											</li>
										),
									)}
								</ul>
							</div>
						)}
						<div className="space-y-2">
							<P className="font-medium text-sm">
								People on this topic
							</P>
							{people.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{people.map((person) => {
										const isRemoved =
											value.removedPeople.includes(
												person.id,
											);
										return (
											<Badge
												key={person.id}
												variant="outline"
												className={cn(
													"max-w-full gap-1 whitespace-normal",
													isRemoved &&
														"text-muted-foreground",
												)}
											>
												<span className="break-words">
													{person.name}
													{isRemoved
														? " · removed"
														: ""}
												</span>
												<Button
													type="button"
													variant="ghost"
													size="icon-sm"
													disabled={
														!value.keep ||
														isSubmitting
													}
													aria-label={`${isRemoved ? "Restore" : "Remove"} ${person.name}`}
													onClick={() =>
														isRemoved
															? onRestorePerson(
																	person.id,
																)
															: onRemovePerson(
																	person.id,
																)
													}
												>
													{isRemoved ? (
														<RotateCcw
															className="size-3"
															aria-hidden="true"
														/>
													) : (
														<X
															className="size-3"
															aria-hidden="true"
														/>
													)}
												</Button>
											</Badge>
										);
									})}
								</div>
							)}
							{addedPeople.map((personId) => {
								const personName =
									evidence?.addedPeopleInfo?.find(
										(person) => person.id === personId,
									)?.name ||
									selectedNames[personId] ||
									personId;
								return (
									<div
										key={personId}
										className="flex items-center gap-2"
									>
										<span className="min-w-0 break-words text-sm">
											{personName}
										</span>
										<Button
											type="button"
											size="sm"
											variant="ghost"
											aria-label={`Remove ${personName}`}
											disabled={
												!value.keep || isSubmitting
											}
											onClick={() =>
												form.setValue(
													`topics.${index}.addedPeople`,
													addedPeople.filter(
														(id) => id !== personId,
													),
													{ shouldDirty: true },
												)
											}
										>
											Remove
										</Button>
									</div>
								);
							})}
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={!value.keep || isSubmitting}
								aria-expanded={isPickerOpen}
								aria-controls={`${id}-people-picker`}
								onClick={() => setPickerOpen(!isPickerOpen)}
							>
								Add people
							</Button>
							{isPickerOpen && (
								<div
									id={`${id}-people-picker`}
									className="space-y-2"
								>
									<Label htmlFor={`${id}-search`}>
										Search your people
									</Label>
									<Input
										id={`${id}-search`}
										value={query}
										disabled={isSubmitting}
										onChange={(event) => {
											setQuery(event.target.value);
											setOffset(0);
										}}
									/>
									<P className="text-muted-foreground text-sm">
										{addedPeople.length} of 30 added people
									</P>
									{isSearching && (
										<output className="text-sm">
											Searching people…
										</output>
									)}
									{searchError && (
										<div>
											<P
												role="alert"
												className="text-destructive text-sm"
											>
												{searchError}
											</P>
											<Button
												type="button"
												size="sm"
												variant="ghost"
												onClick={() => {
													searchRetry.current = true;
													setRetry(
														(attempt) =>
															attempt + 1,
													);
												}}
											>
												Retry people search
											</Button>
										</div>
									)}
									{page?.query === query && (
										<>
											<ul className="max-h-60 overflow-y-auto">
												{page.items
													.filter(
														(person) =>
															person.relationship !==
																"automated" &&
															!person.automated &&
															!people.some(
																(original) =>
																	original.id ===
																	person.id,
															) &&
															!addedPeople.includes(
																person.id,
															),
													)
													.map((person) => (
														<li key={person.id}>
															<Button
																type="button"
																variant="ghost"
																className="h-auto min-h-9 w-full justify-start whitespace-normal text-left"
																disabled={
																	isSubmitting ||
																	addedPeople.length >=
																		30
																}
																onClick={() =>
																	addPerson(
																		person,
																	)
																}
															>
																{person.name ||
																	person.email ||
																	person.id}
															</Button>
														</li>
													))}
											</ul>
											{page.nextOffset < page.total && (
												<Button
													type="button"
													size="sm"
													variant="ghost"
													disabled={
														isSearching ||
														isSubmitting
													}
													onClick={() =>
														setOffset(
															page.nextOffset,
														)
													}
												>
													More people
												</Button>
											)}
											{!page.items.length &&
												!isSearching && (
													<P className="text-muted-foreground text-sm">
														No people match this
														search.
													</P>
												)}
										</>
									)}
								</div>
							)}
							<section
								aria-label="Conversation reach"
								className="space-y-2"
							>
								{isReachLoading && (
									<output className="text-muted-foreground text-sm">
										Updating conversation reach…
									</output>
								)}
								{reach && (
									<div className="text-sm">
										<P className="text-sm">
											{reach.key !== selectedIds
												? "Previous selection: "
												: ""}
											{reach.result.threads} conversations
											involve these people.
											{JSON.parse(reach.key).length > 1
												? ` ${reach.result.together} involve at least two.`
												: ""}
										</P>
										<ul className="list-disc pl-5">
											{reach.result.samples.map(
												(subject, index) => (
													<li
														key={`${index}-${subject}`}
														className="break-words"
													>
														{subject}
													</li>
												),
											)}
										</ul>
									</div>
								)}
								{reachError && (
									<P
										role="alert"
										className="text-destructive text-sm"
									>
										{reachError}
									</P>
								)}
								<Button
									type="button"
									size="sm"
									variant="ghost"
									disabled={isReachLoading}
									onClick={() => {
										forceReach.current = true;
										setReachAttempt(
											(attempt) => attempt + 1,
										);
									}}
								>
									Refresh reach
								</Button>
							</section>
						</div>
					</div>
				)}
			</div>
			<div className="flex flex-wrap gap-2">
				<Button
					id={inspectId}
					type="button"
					variant="outline"
					size="sm"
					disabled={isSubmitting}
					onClick={(event) => onInspect(event.currentTarget)}
					aria-label={`Inspect conversations for ${value.name || "new topic"}`}
				>
					Inspect conversations
				</Button>
				<Badge variant="secondary">
					{evidence?.threadIds.length
						? `${evidence.threadIds.length} example threads`
						: evidence?.accepted
							? "Saved topic"
							: value.key.startsWith("added-")
								? "Added by you"
								: "Suggested topic"}
				</Badge>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={!value.keep || isSubmitting}
					onClick={(event) => onCombine(event.currentTarget)}
					aria-label={`Combine ${value.name || "new topic"} with other topics`}
				>
					Combine with another topic
				</Button>
				{evidence?.domains.map((domain) => (
					<Badge
						key={domain}
						variant="outline"
						className="max-w-full gap-1 whitespace-normal"
					>
						<Globe className="size-3 shrink-0" aria-hidden="true" />
						<span className="break-words">{domain}</span>
					</Badge>
				))}
			</div>
		</section>
	);
}
