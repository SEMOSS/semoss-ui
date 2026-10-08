import { useId, useState } from "react";
import {
	Button,
	Card,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
	Switch,
	Tabs,
	TabsList,
	TabsTrigger,
	Textarea,
} from "@semoss/ui/next";
import type { Memory } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { isListed, MEMORY_MAX_CHARS, refLabel } from "../state/memory";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { collaborationTabsStyles } from "./collaboration-tabs.styles";
import { MemoryRow } from "./memory-list";
import { Section } from "./section";

const FILTERS = [
	{ id: "all", label: "All" },
	{ id: "preferences", label: "Preferences" },
	{ id: "people", label: "People" },
	{ id: "topics", label: "Topics and accounts" },
	{ id: "threads", label: "Threads" },
	{ id: "learned", label: "Learned" },
	{ id: "suggested", label: "Suggestions" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

function matches(memory: Memory, filter: Filter): boolean {
	switch (filter) {
		case "all":
			return true;
		case "preferences":
			return memory.kind === "preference";
		case "people":
			return memory.about.some((ref) => ref.type === "person");
		case "topics":
			return memory.about.some(
				(ref) => ref.type === "topic" || ref.type === "account",
			);
		case "threads":
			return memory.about.some((ref) => ref.type === "thread");
		case "learned":
			return memory.state === "active" && !memory.confirmed;
		case "suggested":
			return memory.state === "suggested";
	}
}

/** Everything the thread assistant keeps across threads, with the switches that control it. */
export function BrainMemory() {
	const fieldId = useId();
	const { state, dispatch } = useCollaborationSession();
	const [filter, setFilter] = useState<Filter>("all");
	const [query, setQuery] = useState("");
	const listed = state.memories.filter(isListed);
	const words = query.trim().toLowerCase();
	const shown = listed
		.filter((memory) => matches(memory, filter))
		.filter(
			(memory) =>
				!words ||
				[
					memory.text,
					...memory.about.map((ref) => refLabel(state, ref)),
				].some((text) => text.toLowerCase().includes(words)),
		)
		.sort(
			(a, b) =>
				Number(b.pinned) - Number(a.pinned) ||
				Number(b.state === "suggested") -
					Number(a.state === "suggested") ||
				b.updatedAt.localeCompare(a.updatedAt),
		);
	const memory = state.settings.memory;
	return (
		<CollaborationSurface
			header={
				<CollaborationPageHeader
					title="Memory"
					description="What the thread assistant keeps for you across threads: your preferences, and facts about people, topics, and threads."
				/>
			}
			aside={
				<>
					<Section title="Settings" variant="card">
						<div className="flex items-center justify-between gap-4">
							<Label htmlFor={`${fieldId}-use`}>
								Use memory in chats
							</Label>
							<Switch
								id={`${fieldId}-use`}
								checked={memory.use}
								onCheckedChange={(use) =>
									dispatch({
										type: "settings.save",
										changes: { memory: { ...memory, use } },
									})
								}
							/>
						</div>
						<Small className="block font-normal text-muted-foreground text-xs leading-5">
							Off: the assistant neither reads nor saves memories.
							Your memories stay here.
						</Small>
						<div className="flex items-center justify-between gap-4">
							<Label htmlFor={`${fieldId}-learn`}>
								Suggest memories from my chats
							</Label>
							<Switch
								id={`${fieldId}-learn`}
								checked={memory.use && memory.learn}
								disabled={!memory.use}
								onCheckedChange={(learn) =>
									dispatch({
										type: "settings.save",
										changes: {
											memory: { ...memory, learn },
										},
									})
								}
							/>
						</div>
						<Small className="block font-normal text-muted-foreground text-xs leading-5">
							After a chat, Brain reads what you wrote and
							suggests what to keep. Nothing is used until you
							keep it.
						</Small>
					</Section>
					<Section title="How memory works" variant="card">
						<P className="text-muted-foreground text-xs leading-5">
							When you tell the assistant something lasting, it
							saves it and shows it in the chat, where you can
							undo it. What it learned stays background until you
							confirm it: it never adds a recipient or sends
							anything because of an unconfirmed memory.
						</P>
						<P className="text-muted-foreground text-xs leading-5">
							Type /remember and a sentence in any chat to save it
							yourself.
						</P>
					</Section>
					<DeleteAllMemories count={listed.length} />
				</>
			}
			asideTitle="Memory settings"
		>
			<Card className="gap-0 p-0 shadow-none">
				<div className="space-y-4 border-b p-4 md:px-6">
					<NewMemoryForm />
				</div>
				<div className="space-y-3 border-b p-4 md:px-6">
					<Label htmlFor={`${fieldId}-search`} className="sr-only">
						Search memories
					</Label>
					<Input
						id={`${fieldId}-search`}
						type="search"
						placeholder="Search memories"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
					<Tabs
						value={filter}
						onValueChange={(value) => setFilter(value as Filter)}
					>
						<TabsList
							className={`${collaborationTabsStyles.list} flex-wrap`}
						>
							{FILTERS.map(({ id, label }) => (
								<TabsTrigger
									key={id}
									value={id}
									className={collaborationTabsStyles.trigger}
								>
									{label} (
									{
										listed.filter((item) =>
											matches(item, id),
										).length
									}
									)
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
				</div>
				<div className="px-4 md:px-6">
					{shown.map((item) => (
						<MemoryRow key={item.id} memory={item} allowPin />
					))}
					{!shown.length && (
						<P className="py-6 text-muted-foreground text-sm">
							{listed.length
								? "No memory matches."
								: "No memories yet. Tell the assistant something lasting in a thread, or add one above."}
						</P>
					)}
				</div>
			</Card>
		</CollaborationSurface>
	);
}

// a memory that applies everywhere; memories about a person, topic, or thread are added on its page
function NewMemoryForm() {
	const fieldId = useId();
	const { dispatch } = useCollaborationSession();
	const [kind, setKind] = useState<Memory["kind"]>("preference");
	const [text, setText] = useState("");
	const [error, setError] = useState("");
	return (
		<form
			className="space-y-3"
			noValidate
			onSubmit={(event) => {
				event.preventDefault();
				const value = text.trim();
				if (!value) {
					setError("Write the memory first.");
					return;
				}
				dispatch({
					type: "memory.save",
					memory: { kind, text: value.slice(0, MEMORY_MAX_CHARS) },
				});
				setText("");
				setError("");
			}}
		>
			<div className="space-y-2">
				<Label htmlFor={`${fieldId}-text`}>New memory</Label>
				<Textarea
					id={`${fieldId}-text`}
					value={text}
					maxLength={MEMORY_MAX_CHARS}
					placeholder="For example: Keep status emails to three bullets."
					aria-invalid={Boolean(error)}
					aria-describedby={error ? `${fieldId}-error` : undefined}
					onChange={(event) => setText(event.target.value)}
				/>
				{error && (
					<Small
						id={`${fieldId}-error`}
						className="block text-destructive text-xs"
					>
						{error}
					</Small>
				)}
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Label htmlFor={`${fieldId}-kind`} className="sr-only">
					Kind
				</Label>
				<Select
					value={kind}
					onValueChange={(value) =>
						setKind(value === "fact" ? "fact" : "preference")
					}
				>
					<SelectTrigger
						id={`${fieldId}-kind`}
						className="h-9 w-auto"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="preference">
							Preference: how I want things done
						</SelectItem>
						<SelectItem value="fact">
							Fact: something true
						</SelectItem>
					</SelectContent>
				</Select>
				<Button type="submit" variant="outline" size="sm">
					Add
				</Button>
			</div>
		</form>
	);
}

function DeleteAllMemories({ count }: { count: number }) {
	const { dispatch } = useCollaborationSession();
	const [isOpen, setIsOpen] = useState(false);
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" disabled={!count}>
					Delete all memories
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete all {count} memories?</DialogTitle>
					<DialogDescription>
						The assistant forgets everything here, including
						suggestions. Your threads, topics, and people stay. This
						cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => setIsOpen(false)}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={() => {
							dispatch({ type: "memory.clear" });
							setIsOpen(false);
						}}
					>
						Delete all
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
