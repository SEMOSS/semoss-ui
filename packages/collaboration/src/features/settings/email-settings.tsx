import { useCallback, useEffect, useId, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	H2,
	Input,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
} from "@semoss/ui/next";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import {
	createDraftFolder,
	type DraftFolder,
	listDraftFolders,
} from "./draft-folder-api";

const DEFAULT_FOLDER = "default";
const SUGGESTED_NAME = "Teamwork Drafts";

/** Where the drafts the assistant writes are left in the owner's Outlook mailbox. */
export function EmailSettings() {
	const { actions } = useInsight();
	const { state, dispatch } = useCollaborationSession();
	const { draftFolderId, draftFolderName } = state.settings;
	const isLive = state.liveProfile !== null;
	const fieldId = useId();
	const [folders, setFolders] = useState<DraftFolder[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const load = useCallback(async () => {
		setIsLoading(true);
		setError("");
		try {
			setFolders(await listDraftFolders(actions));
		} catch (cause: unknown) {
			setError(
				`Could not read your Outlook folders: ${cause instanceof Error ? cause.message : String(cause)}`,
			);
		} finally {
			setIsLoading(false);
		}
	}, [actions]);

	useEffect(() => {
		if (isLive) void load();
	}, [isLive, load]);

	const choose = (folder: DraftFolder | null) =>
		dispatch({
			type: "settings.save",
			changes: {
				draftFolderId: folder?.id ?? "",
				draftFolderName: folder?.path ?? "",
			},
		});

	// a chosen folder that is no longer listed (deleted, or deeper than listed) still shows by name
	const chosenListed = folders.some((folder) => folder.id === draftFolderId);
	return (
		<section className="min-w-0" aria-labelledby={`${fieldId}-title`}>
			<Card className="gap-5 p-5 shadow-none">
				<header className="space-y-2 border-b pb-4">
					<H2 id={`${fieldId}-title`} className="font-medium text-xl">
						Email
					</H2>
					<P className="text-base text-muted-foreground">
						Choose where drafts the assistant writes are left in
						Outlook, so you can review them together in the Outlook
						app. Nothing is sent until you send it.
					</P>
				</header>
				<div className="space-y-2">
					<Label htmlFor={`${fieldId}-folder`}>Draft folder</Label>
					<Select
						value={draftFolderId || DEFAULT_FOLDER}
						disabled={!isLive}
						onValueChange={(value) =>
							choose(
								value === DEFAULT_FOLDER
									? null
									: (folders.find(
											(folder) => folder.id === value,
										) ?? null),
							)
						}
					>
						<SelectTrigger
							id={`${fieldId}-folder`}
							className="max-w-md"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={DEFAULT_FOLDER}>
								Drafts (Outlook default)
							</SelectItem>
							{draftFolderId && !chosenListed && (
								<SelectItem value={draftFolderId}>
									{draftFolderName || "Chosen folder"}
								</SelectItem>
							)}
							{folders.map((folder) => (
								<SelectItem key={folder.id} value={folder.id}>
									{folder.path}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{!isLive && (
						<P className="text-muted-foreground text-sm">
							Connect your Microsoft account to choose a folder.
						</P>
					)}
					<div className="flex flex-wrap gap-2 pt-1">
						<NewFolderDialog
							disabled={!isLive}
							onCreated={(folder) => {
								setFolders((current) =>
									current.some((f) => f.id === folder.id)
										? current
										: [...current, folder],
								);
								choose(folder);
							}}
						/>
						<Button
							type="button"
							variant="ghost"
							disabled={!isLive || isLoading}
							onClick={() => void load()}
						>
							{isLoading ? "Refreshing..." : "Refresh folders"}
						</Button>
					</div>
				</div>
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				<P className="text-muted-foreground text-sm">
					New drafts, replies and forwards are moved there when they
					are saved. If the folder is deleted in Outlook, drafts stay
					in Drafts.
				</P>
			</Card>
		</section>
	);
}

function NewFolderDialog({
	disabled,
	onCreated,
}: {
	disabled: boolean;
	onCreated: (folder: DraftFolder) => void;
}) {
	const { actions } = useInsight();
	const fieldId = useId();
	const [isOpen, setIsOpen] = useState(false);
	const [name, setName] = useState(SUGGESTED_NAME);
	const [inInbox, setInInbox] = useState(false);
	const [isBusy, setIsBusy] = useState(false);
	const [error, setError] = useState("");

	const create = async () => {
		setIsBusy(true);
		setError("");
		try {
			onCreated(await createDraftFolder(actions, name.trim(), inInbox));
			setIsOpen(false);
		} catch (cause: unknown) {
			setError(
				`Could not create the folder: ${cause instanceof Error ? cause.message : String(cause)}`,
			);
		} finally {
			setIsBusy(false);
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(next) => {
				if (isBusy) return;
				setIsOpen(next);
				if (next) setError("");
			}}
		>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" disabled={disabled}>
					Create a folder
				</Button>
			</DialogTrigger>
			<DialogContent aria-busy={isBusy}>
				<DialogHeader>
					<DialogTitle>Create an Outlook folder</DialogTitle>
					<DialogDescription>
						The folder is made in your mailbox and used for new
						drafts. If one with this name is already there, it is
						used instead.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={`${fieldId}-name`}>Folder name</Label>
						<Input
							id={`${fieldId}-name`}
							value={name}
							maxLength={100}
							onChange={(event) => setName(event.target.value)}
						/>
					</div>
					<div className="flex items-center justify-between gap-4">
						<Label htmlFor={`${fieldId}-inbox`}>
							Make it inside Inbox
						</Label>
						<Switch
							id={`${fieldId}-inbox`}
							checked={inInbox}
							onCheckedChange={setInInbox}
						/>
					</div>
				</div>
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isBusy}
						onClick={() => setIsOpen(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={isBusy || !name.trim()}
						onClick={() => void create()}
					>
						{isBusy ? "Creating..." : "Create folder"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
