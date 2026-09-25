import { useState } from "react";
import { Alert, AlertDescription, Button, H2, H3, P } from "@semoss/ui/next";
import { useSources } from "../hooks/use-sources";
import type { ImportedSource } from "../types";
import { EmailDraftDialog } from "./email-draft-dialog";
import { MailSearchForm } from "./mail-search-form";
import { SourcePreview } from "./source-preview";

export interface SourcesViewProps {
	/** Adds a selected, validated source to the shared session; no fixture substitution. */
	onImport: (source: ImportedSource) => void;
}

/** Load Microsoft sources on demand and preview them before importing into Work. */
export function SourcesView({ onImport }: SourcesViewProps) {
	const sources = useSources();
	const [isNewDraftOpen, setIsNewDraftOpen] = useState(false);
	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0">
					<H2 className="font-semibold text-lg">
						Connect your sources
					</H2>
					<P className="text-muted-foreground">
						Choose what to read, then add the useful conversations
						to Work.
					</P>
				</div>
				<Button
					type="button"
					variant="outline"
					disabled={sources.loads.connection.isLoading}
					onClick={() => void sources.connect()}
				>
					{sources.loads.connection.isLoading
						? "Connecting…"
						: "Connect Microsoft"}
				</Button>
			</header>
			{sources.loads.connection.error && (
				<Alert variant="destructive">
					<AlertDescription>
						{sources.loads.connection.error}
					</AlertDescription>
				</Alert>
			)}
			{sources.loads.connection.hasLoaded && (
				<output className="block text-muted-foreground">
					Microsoft sign-in completed. Load a source to check its
					permissions.
				</output>
			)}
			<section
				className="rounded-lg border border-border bg-background p-4"
				aria-label="Outlook email"
			>
				<div className="mb-4 flex flex-wrap items-start justify-between gap-4">
					<div>
						<H3 className="font-medium text-base">Outlook email</H3>
						<P className="text-muted-foreground">
							Choose a date range to load up to 20 messages. Read
							a message to load its text.
						</P>
					</div>
					<Button
						type="button"
						variant="outline"
						onClick={() => setIsNewDraftOpen(true)}
					>
						New draft
					</Button>
				</div>
				<MailSearchForm
					folders={sources.folders}
					isLoading={sources.loads.mail.isLoading}
					onSearch={sources.loadMail}
				/>
				{sources.loads.mail.error && (
					<Alert className="mt-4" variant="destructive">
						<AlertDescription>
							{sources.loads.mail.error}
						</AlertDescription>
					</Alert>
				)}
				{sources.folderError && (
					<Alert className="mt-4">
						<AlertDescription>
							{sources.folderError}
						</AlertDescription>
					</Alert>
				)}
				<output className="mt-4 block text-muted-foreground text-sm">
					{sources.loads.mail.isLoading
						? "Loading email headers…"
						: sources.loads.mail.hasLoaded
							? `${sources.mail.length} messages loaded. This is a limited result set.`
							: "Email is loaded only when you ask."}
				</output>
				<ul className="mt-2 divide-y divide-border">
					{sources.mail.map((mail) => (
						<li
							key={mail.uid}
							className="flex flex-wrap items-center gap-4 py-3"
						>
							<div className="min-w-0 flex-1">
								<P className="break-words font-medium">
									{mail.subject || "Untitled email"}
								</P>
								<P className="break-words text-muted-foreground">
									{mail.from || "Sender unavailable"}
									{mail.unread ? " · Unread" : ""}
									{mail.hasAttachments
										? " · Attachments"
										: ""}
								</P>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={sources.loads.selection.isLoading}
								aria-label={`Read ${mail.subject || "email"}`}
								onClick={() =>
									void sources.selectMail(mail.uid)
								}
							>
								Read
							</Button>
						</li>
					))}
				</ul>
			</section>
			<div className="grid gap-6 lg:grid-cols-2">
				<section
					className="min-w-0 rounded-lg border border-border bg-background p-4"
					aria-label="Teams chats"
				>
					<H3 className="font-medium text-base">Teams chats</H3>
					<P className="text-muted-foreground">
						Load up to 20 chats. Selecting a chat reads its latest
						30 messages.
					</P>
					<Button
						type="button"
						variant="outline"
						className="mt-4"
						disabled={sources.loads.teams.isLoading}
						onClick={() => void sources.loadTeams()}
					>
						{sources.loads.teams.isLoading
							? "Loading chats…"
							: "Load Teams chats"}
					</Button>
					{sources.loads.teams.error && (
						<Alert className="mt-4" variant="destructive">
							<AlertDescription>
								{sources.loads.teams.error}
							</AlertDescription>
						</Alert>
					)}
					<output className="mt-2 block text-muted-foreground text-sm">
						{sources.loads.teams.hasLoaded
							? `${sources.chats.length} chats loaded.`
							: ""}
					</output>
					<ul className="mt-2 divide-y divide-border">
						{sources.chats.map((chat) => (
							<li
								key={chat.id}
								className="flex items-center gap-4 py-3"
							>
								<P className="min-w-0 flex-1 break-words">
									{chat.displayName ||
										chat.topic ||
										"Teams chat"}
								</P>
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={sources.loads.selection.isLoading}
									aria-label={`Read ${chat.displayName || chat.topic || "chat"}`}
									onClick={() =>
										void sources.selectChat(chat)
									}
								>
									Read
								</Button>
							</li>
						))}
					</ul>
				</section>
				<section
					className="min-w-0 rounded-lg border border-border bg-background p-4"
					aria-label="Outlook calendar"
				>
					<H3 className="font-medium text-base">Outlook calendar</H3>
					<P className="text-muted-foreground">
						Up to 30 events in the next 7 days. Selecting an event
						loads its details.
					</P>
					<Button
						type="button"
						variant="outline"
						className="mt-4"
						disabled={sources.loads.calendar.isLoading}
						onClick={() => void sources.loadCalendar()}
					>
						{sources.loads.calendar.isLoading
							? "Loading events…"
							: "Load calendar"}
					</Button>
					{sources.loads.calendar.error && (
						<Alert className="mt-4" variant="destructive">
							<AlertDescription>
								{sources.loads.calendar.error}
							</AlertDescription>
						</Alert>
					)}
					<output className="mt-2 block text-muted-foreground text-sm">
						{sources.loads.calendar.hasLoaded
							? `${sources.events.length} events loaded.`
							: ""}
					</output>
					<ul className="mt-2 divide-y divide-border">
						{sources.events.map((event) => (
							<li
								key={event.id}
								className="flex items-center gap-4 py-3"
							>
								<P className="min-w-0 flex-1 break-words">
									{event.subject || "Untitled event"}
								</P>
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={sources.loads.selection.isLoading}
									aria-label={`Read ${event.subject || "event"}`}
									onClick={() =>
										void sources.selectEvent(event.id)
									}
								>
									Read
								</Button>
							</li>
						))}
					</ul>
				</section>
			</div>
			{sources.loads.selection.error && (
				<Alert variant="destructive">
					<AlertDescription>
						{sources.loads.selection.error}
					</AlertDescription>
				</Alert>
			)}
			<output className="block text-muted-foreground text-sm">
				{sources.loads.selection.isLoading
					? "Reading the selected source…"
					: ""}
			</output>
			{sources.selected && (
				<SourcePreview
					key={`${sources.selected.sourceKind}:${sources.selected.nativeId}`}
					source={sources.selected}
					isLoading={sources.loads.selection.isLoading}
					onImport={onImport}
				/>
			)}
			<P className="text-muted-foreground">
				Imported sources stay in this session. Asking the assistant
				about them stores the selected context in the backend
				conversation. Source permissions and saved conversations are
				separate from local Brain edits.
			</P>
			<EmailDraftDialog
				isOpen={isNewDraftOpen}
				onOpenChange={setIsNewDraftOpen}
				mode="new"
			/>
		</div>
	);
}
