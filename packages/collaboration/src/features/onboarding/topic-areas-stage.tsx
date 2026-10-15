import { Pencil, Plus } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import {
	Button,
	cn,
	FormCheckbox,
	FormInput,
	Input,
	Label,
	P,
	useFormContext,
} from "@semoss/ui/next";
import { DOT, topicSummary } from "./topic-flow-utils";
import type {
	TopicArea,
	TopicReview,
	TopicReviewDraft,
} from "./topic-review-api";

const MORE = 5;

interface TopicAreasStageProps {
	review: TopicReview;
	values: TopicReviewDraft;
	/** How many areas are on screen; the rest wait behind Show more. */
	revealed: number;
	isBusy: boolean;
	onReveal: (count: number) => void;
	onRegroup: (areaKey: string, split: boolean) => void;
	onAddTopic: (name: string) => void;
}

/** A few areas of work at a time; each can be kept whole or as its smaller topics. */
export function TopicAreasStage({
	review,
	values,
	revealed,
	isBusy,
	onReveal,
	onRegroup,
	onAddTopic,
}: TopicAreasStageProps) {
	const form = useFormContext<TopicReviewDraft>();
	const addId = useId();
	const [newName, setNewName] = useState("");
	const [renaming, setRenaming] = useState<string | null>(null);
	const areas = review.draft.areas;
	const indexOf = (key: string) =>
		values.topics.findIndex((topic) => topic.key === key);
	const isKept = (area: TopicArea) =>
		area.topicKeys.some(
			(key) =>
				values.topics[indexOf(key)]?.keep &&
				!review.draft.topics.find((t) => t.key === key)?.mergedIntoKey,
		);
	// an area the owner kept never hides behind Show more
	const lastKept = areas.reduce(
		(last, area, index) => (isKept(area) ? index : last),
		-1,
	);
	const shown = Math.min(areas.length, Math.max(revealed, lastKept + 1));
	const inArea = new Set(areas.flatMap((area) => area.topicKeys));
	// a topic folded into another is shown through that one
	const merged = new Set(
		review.draft.topics
			.filter((topic) => topic.mergedIntoKey)
			.map((topic) => topic.key),
	);
	const saved = values.topics.filter(
		(topic) =>
			!inArea.has(topic.key) &&
			!topic.key.startsWith("added-") &&
			!merged.has(topic.key),
	);
	const added = values.topics.filter((topic) =>
		topic.key.startsWith("added-"),
	);

	const reveal = () => {
		const next = Math.min(areas.length, shown + MORE);
		// newly shown areas you take part in start kept, like the first ones
		for (const area of areas.slice(shown, next)) {
			if (!area.suggested || area.split) continue;
			const index = indexOf(area.topicKeys[0]);
			if (index >= 0)
				form.setValue(`topics.${index}.keep`, true, {
					shouldDirty: true,
				});
		}
		onReveal(next);
	};

	const add = () => {
		if (!newName.trim()) return;
		onAddTopic(newName.trim());
		setNewName("");
	};

	const row = (key: string, extra?: ReactNode) => {
		const index = indexOf(key);
		const value = values.topics[index];
		if (!value) return null;
		const evidence = review.draft.topics.find((topic) => topic.key === key);
		const isRenaming = renaming === key;
		return (
			<div className="flex min-w-0 flex-col gap-1">
				<div className="flex min-w-0 items-start justify-between gap-2">
					{isRenaming ? (
						<FormInput
							name={`topics.${index}.name`}
							aria-label="Topic name"
							className="max-w-sm"
							autoFocus
							onBlur={() => setRenaming(null)}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									setRenaming(null);
								}
							}}
						/>
					) : (
						<FormCheckbox
							name={`topics.${index}.keep`}
							label={
								<span className="font-medium">
									{value.name || "New topic"}
								</span>
							}
							disabled={isBusy || evidence?.accepted}
						/>
					)}
					{!isRenaming && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-7 shrink-0"
							disabled={isBusy}
							aria-label={`Rename ${value.name || "new topic"}`}
							onClick={() => setRenaming(key)}
						>
							<Pencil className="size-3.5" aria-hidden="true" />
						</Button>
					)}
				</div>
				<P className="pl-6 text-muted-foreground text-xs">
					{topicSummary(evidence, value) ||
						(evidence?.accepted
							? "Already saved"
							: "No conversations yet")}
				</P>
				{form.formState.errors.topics?.[index]?.name && (
					<P className="pl-6 text-destructive text-xs" role="alert">
						Name this topic or turn off Keep.
					</P>
				)}
				{extra}
			</div>
		);
	};

	return (
		<div className="flex flex-col gap-2">
			{saved.length > 0 && (
				<ul className="divide-y rounded-lg border">
					{saved.map((topic) => (
						<li key={topic.key} className="px-3 py-2.5">
							{row(topic.key)}
						</li>
					))}
				</ul>
			)}
			{areas.length > 0 && (
				<ul className="divide-y rounded-lg border">
					{areas.slice(0, shown).map((area) => {
						const parts = area.topicKeys.map((key) =>
							review.draft.topics.find(
								(topic) => topic.key === key,
							),
						);
						const partNames = parts.map((part, index) =>
							index === 0
								? (part?.own?.name ?? part?.name ?? "")
								: (part?.name ?? ""),
						);
						const isGroup = area.topicKeys.length > 1;
						return (
							<li
								key={area.key}
								className={cn(
									"px-3 py-2.5",
									!isKept(area) && "bg-muted/30",
								)}
							>
								{!isGroup ? (
									row(area.topicKeys[0])
								) : !area.split ? (
									row(
										area.topicKeys[0],
										<div className="flex flex-wrap items-center gap-x-2 pl-6 text-xs">
											<span className="text-muted-foreground">
												Includes{" "}
												{partNames.join(` ${DOT} `)}
											</span>
											<Button
												type="button"
												variant="link"
												size="sm"
												className="h-auto p-0 text-xs"
												disabled={isBusy}
												onClick={() =>
													onRegroup(area.key, true)
												}
											>
												Keep these separate
											</Button>
										</div>,
									)
								) : (
									<div className="flex flex-col gap-2">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<P className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
												{area.name}
											</P>
											<Button
												type="button"
												variant="link"
												size="sm"
												className="h-auto p-0 text-xs"
												disabled={isBusy}
												onClick={() =>
													onRegroup(area.key, false)
												}
											>
												Combine into one topic
											</Button>
										</div>
										<ul className="flex flex-col gap-2 border-l pl-3">
											{area.topicKeys.map((key) => (
												<li key={key}>{row(key)}</li>
											))}
										</ul>
									</div>
								)}
							</li>
						);
					})}
				</ul>
			)}
			{shown < areas.length && (
				<Button
					type="button"
					variant="outline"
					className="self-start"
					disabled={isBusy}
					onClick={reveal}
				>
					Show {Math.min(MORE, areas.length - shown)} more
					<span className="text-muted-foreground">
						({areas.length - shown} left)
					</span>
				</Button>
			)}
			{added.length > 0 && (
				<ul className="divide-y rounded-lg border">
					{added.map((topic) => (
						<li key={topic.key} className="px-3 py-2.5">
							{row(topic.key)}
						</li>
					))}
				</ul>
			)}
			<div className="flex max-w-md items-end gap-2 pt-2">
				<div className="flex-1 space-y-1">
					<Label htmlFor={addId} className="text-sm">
						Add a topic
					</Label>
					<Input
						id={addId}
						value={newName}
						maxLength={255}
						placeholder="For example, Hiring"
						disabled={isBusy}
						onChange={(event) => setNewName(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								add();
							}
						}}
					/>
				</div>
				<Button
					type="button"
					variant="outline"
					disabled={isBusy || !newName.trim()}
					onClick={add}
				>
					<Plus aria-hidden="true" /> Add
				</Button>
			</div>
		</div>
	);
}
