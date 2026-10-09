import { useId, useState } from "react";
import { Link } from "react-router";
import {
	Badge,
	Button,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
	Textarea,
} from "@semoss/ui/next";
import { threadPath } from "@/lib/workspace-paths";
import { dateLabel } from "../date-label";
import type { Memory, MemoryRef } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import {
	MEMORY_MAX_CHARS,
	originLabel,
	refLabel,
	sameRef,
} from "../state/memory";
import { TextEntryForm } from "./text-entry-form";

/** Where a memory's link opens; accounts have no page. */
function refPath(ref: MemoryRef): string | null {
	switch (ref.type) {
		case "person":
			return `/brain/people/${encodeURIComponent(ref.id)}`;
		case "topic":
			return `/brain/topics/${encodeURIComponent(ref.id)}`;
		case "thread":
			return threadPath(ref.id);
		case "account":
			return null;
	}
}

/** One memory with what it is about, who wrote it, and the actions its state allows. */
export function MemoryRow({
	memory,
	hideRef,
	allowPin = false,
}: {
	memory: Memory;
	/** The person, topic, or thread the list is already about, left out of the links. */
	hideRef?: MemoryRef;
	allowPin?: boolean;
}) {
	const { state, dispatch } = useCollaborationSession();
	const [isEditing, setIsEditing] = useState(false);
	const isSuggestion = memory.state === "suggested";
	const isLearned = memory.state === "active" && !memory.confirmed;
	const resolve = (
		action: "accept" | "confirm" | "dismiss" | "restore" | "reopen",
	) => dispatch({ type: "memory.resolve", memoryId: memory.id, action });
	const details = [
		originLabel(memory),
		memory.source.label,
		memory.expiresAt ? `Until ${dateLabel(memory.expiresAt)}` : undefined,
		memory.updatedAt ? dateLabel(memory.updatedAt) : undefined,
	].filter(Boolean);
	return (
		<article
			className="space-y-2 border-border border-b py-3 last:border-0"
			aria-label={`Memory: ${memory.text}`}
		>
			{isEditing ? (
				<MemoryEditForm
					memory={memory}
					onDone={() => setIsEditing(false)}
				/>
			) : (
				<P className="break-words text-sm leading-6">{memory.text}</P>
			)}
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				{memory.kind === "preference" && (
					<Badge variant="secondary" className="font-normal text-xs">
						Preference
					</Badge>
				)}
				{isSuggestion && (
					<Badge variant="outline" className="font-normal text-xs">
						Not used until you keep it
					</Badge>
				)}
				{isLearned && (
					<Badge variant="outline" className="font-normal text-xs">
						Learned, not confirmed
					</Badge>
				)}
				{memory.pinned && (
					<Badge variant="secondary" className="font-normal text-xs">
						Pinned
					</Badge>
				)}
				{memory.about
					.filter((ref) => !hideRef || !sameRef(ref, hideRef))
					.map((ref) => {
						const label = refLabel(state, ref);
						const path = refPath(ref);
						return path ? (
							<Link
								key={`${ref.type}:${ref.id}`}
								to={path}
								className="text-xs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
							>
								{label}
							</Link>
						) : (
							<Small
								key={`${ref.type}:${ref.id}`}
								className="font-normal text-xs"
							>
								{label}
							</Small>
						);
					})}
				<Small className="font-normal text-muted-foreground text-xs">
					{details.join(" · ")}
				</Small>
			</div>
			<div className="-ml-2 flex flex-wrap gap-1">
				{isSuggestion && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => resolve("accept")}
						aria-label={`Keep memory: ${memory.text}`}
					>
						Keep
					</Button>
				)}
				{isLearned && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => resolve("confirm")}
						aria-label={`Confirm memory: ${memory.text}`}
					>
						Confirm
					</Button>
				)}
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setIsEditing((value) => !value)}
					aria-label={`${isEditing ? "Stop editing" : "Edit"} memory: ${memory.text}`}
				>
					{isEditing ? "Cancel" : "Edit"}
				</Button>
				{allowPin && !isSuggestion && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							dispatch({
								type: "memory.save",
								memory: {
									id: memory.id,
									pinned: !memory.pinned,
								},
							})
						}
						aria-label={`${memory.pinned ? "Unpin" : "Pin"} memory: ${memory.text}`}
					>
						{memory.pinned ? "Unpin" : "Pin"}
					</Button>
				)}
				{isSuggestion ? (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => resolve("dismiss")}
						aria-label={`Dismiss memory: ${memory.text}`}
					>
						Dismiss
					</Button>
				) : (
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							dispatch({
								type: "memory.delete",
								memoryId: memory.id,
							})
						}
						aria-label={`Remove memory: ${memory.text}`}
					>
						Remove
					</Button>
				)}
			</div>
		</article>
	);
}

// the owner's edit confirms the memory, and accepts a suggestion
function MemoryEditForm({
	memory,
	onDone,
}: {
	memory: Memory;
	onDone: () => void;
}) {
	const fieldId = useId();
	const { dispatch } = useCollaborationSession();
	const [text, setText] = useState(memory.text);
	const [kind, setKind] = useState(memory.kind);
	return (
		<form
			className="space-y-2"
			noValidate
			onSubmit={(event) => {
				event.preventDefault();
				const value = text.trim();
				if (!value) return;
				dispatch({
					type: "memory.save",
					memory: {
						id: memory.id,
						kind,
						text: value.slice(0, MEMORY_MAX_CHARS),
					},
				});
				onDone();
			}}
		>
			<Label htmlFor={`${fieldId}-text`}>Memory</Label>
			<Textarea
				id={`${fieldId}-text`}
				value={text}
				maxLength={MEMORY_MAX_CHARS}
				onChange={(event) => setText(event.target.value)}
			/>
			<div className="flex flex-wrap items-center gap-2">
				<Label htmlFor={`${fieldId}-kind`} className="sr-only">
					Kind
				</Label>
				<Select
					value={kind}
					onValueChange={(value) =>
						setKind(value === "preference" ? "preference" : "fact")
					}
				>
					<SelectTrigger
						id={`${fieldId}-kind`}
						className="h-8 w-auto text-xs"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="preference">Preference</SelectItem>
						<SelectItem value="fact">Fact</SelectItem>
					</SelectContent>
				</Select>
				<Button type="submit" variant="outline" size="sm">
					Save memory
				</Button>
			</div>
		</form>
	);
}

/** Memories about one thing, with a way to add one; used on topics, people, and threads. */
export function MemoryList({
	memories,
	emptyText,
	addLabel,
	about,
	isSample = false,
}: {
	memories: Memory[];
	emptyText: string;
	/** Shows an add form; new memories are facts about `about`. */
	addLabel?: string;
	/** What the list is about: new memories link to it, and rows do not repeat it. */
	about?: MemoryRef;
	isSample?: boolean;
}) {
	const { dispatch } = useCollaborationSession();
	return (
		<div className="space-y-3">
			{memories.length ? (
				<div>
					{memories.map((memory) => (
						<MemoryRow
							key={memory.id}
							memory={memory}
							hideRef={about}
						/>
					))}
				</div>
			) : (
				<Small className="block font-normal text-muted-foreground text-xs leading-5">
					{emptyText}
				</Small>
			)}
			{addLabel && (
				<TextEntryForm
					label={addLabel}
					multiline
					onSave={(text) =>
						dispatch({
							type: "memory.save",
							memory: {
								kind: "fact",
								text: text.slice(0, MEMORY_MAX_CHARS),
								about: about ? [about] : [],
								isSample,
							},
						})
					}
				/>
			)}
		</div>
	);
}
