import { useCallback, useEffect, useId, useRef, useState } from "react";
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
	H3,
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
import { StyleSettings } from "@/features/collaboration/components/style-settings";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { SignatureFrame } from "@/features/connectors/components/draft-look";
import { sanitizeDraftHtml } from "@/features/email/email-html";
import {
	createDraftFolder,
	type DraftFolder,
	learnDraftFormat,
	listDraftFolders,
} from "./draft-folder-api";

const DEFAULT_FOLDER = "default";
const SUGGESTED_NAME = "Teamwork Drafts";
const FONTS = [
	"Aptos",
	"Calibri",
	"Arial",
	"Segoe UI",
	"Helvetica",
	"Verdana",
	"Georgia",
	"Times New Roman",
];
const SIZES = [9, 10, 11, 12, 14, 16];

/** How the assistant writes your email: style, font, signature, and the Outlook folder drafts are left in. */
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
						How the assistant writes email as you, how drafts look,
						and where they are left in Outlook. Nothing is sent
						until you send it.
					</P>
				</header>
				{state.liveProfile && (
					<StyleSettings profile={state.liveProfile} />
				)}
				<DraftLook isLive={isLive} />
				<div className="space-y-2 border-border border-t pt-5">
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

/** Font and signature every draft is written with. */
function DraftLook({ isLive }: { isLive: boolean }) {
	const { actions } = useInsight();
	const { state, dispatch } = useCollaborationSession();
	const { draftFont, draftFontSize, draftSignatureHtml, draftSignatureOn } =
		state.settings;
	const fieldId = useId();
	const [isCopying, setIsCopying] = useState(false);
	const [notice, setNotice] = useState("");
	const [error, setError] = useState("");
	const fonts = FONTS.includes(draftFont) ? FONTS : [draftFont, ...FONTS];
	const sizes = SIZES.includes(draftFontSize)
		? SIZES
		: [...SIZES, draftFontSize].sort((a, b) => a - b);

	const copy = async () => {
		setIsCopying(true);
		setError("");
		setNotice("");
		try {
			const learned = await learnDraftFormat(actions);
			if (!learned.signatureHtml && !learned.font) {
				setNotice(
					learned.read === 0
						? "No recent sent mail was found. Import your mail under Connections first."
						: "No signature or font was found in your recent sent mail.",
				);
				return;
			}
			dispatch({
				type: "settings.save",
				changes: {
					...(learned.signatureHtml && {
						draftSignatureHtml: learned.signatureHtml,
						draftSignatureOn: true,
					}),
					...(learned.font && { draftFont: learned.font }),
					...(learned.fontSize && {
						draftFontSize: learned.fontSize,
					}),
				},
			});
			setNotice(
				learned.signatureHtml
					? "Copied from your recent sent mail."
					: "Copied the font. No signature was found in your recent sent mail.",
			);
		} catch (cause: unknown) {
			setError(
				`Could not read your sent mail: ${cause instanceof Error ? cause.message : String(cause)}`,
			);
		} finally {
			setIsCopying(false);
		}
	};

	return (
		<section
			className="space-y-4 border-border border-t pt-5"
			aria-labelledby={`${fieldId}-title`}
		>
			<div className="space-y-1">
				<H3 id={`${fieldId}-title`} className="font-medium text-base">
					Font and signature
				</H3>
				<P className="text-muted-foreground text-sm">
					Drafts are written in this font with your signature, the way
					Outlook writes your own mail.
				</P>
			</div>
			<div className="flex flex-wrap gap-4">
				<div className="space-y-2">
					<Label htmlFor={`${fieldId}-font`}>Font</Label>
					<Select
						value={draftFont}
						onValueChange={(value) =>
							dispatch({
								type: "settings.save",
								changes: { draftFont: value },
							})
						}
					>
						<SelectTrigger id={`${fieldId}-font`} className="w-56">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{fonts.map((font) => (
								<SelectItem key={font} value={font}>
									<span style={{ fontFamily: font }}>
										{font}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${fieldId}-size`}>Size</Label>
					<Select
						value={String(draftFontSize)}
						onValueChange={(value) =>
							dispatch({
								type: "settings.save",
								changes: { draftFontSize: Number(value) },
							})
						}
					>
						<SelectTrigger id={`${fieldId}-size`} className="w-28">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{sizes.map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size} pt
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
			<div className="space-y-2">
				<div className="flex items-center justify-between gap-4">
					<Label htmlFor={`${fieldId}-signature`}>
						Add my signature
					</Label>
					<Switch
						id={`${fieldId}-signature`}
						checked={
							draftSignatureOn && Boolean(draftSignatureHtml)
						}
						disabled={!draftSignatureHtml}
						onCheckedChange={(on) =>
							dispatch({
								type: "settings.save",
								changes: { draftSignatureOn: on },
							})
						}
					/>
				</div>
				{draftSignatureHtml ? (
					<SignatureFrame
						html={draftSignatureHtml}
						font={draftFont}
						size={draftFontSize}
						className="h-40 w-full max-w-md rounded-md border bg-white"
					/>
				) : (
					<P className="text-muted-foreground text-sm">
						No signature yet. Copy it from the mail you have sent,
						or paste it from Outlook.
					</P>
				)}
			</div>
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					disabled={!isLive || isCopying}
					onClick={() => void copy()}
				>
					{isCopying
						? "Reading sent mail..."
						: "Copy from my sent mail"}
				</Button>
				<PasteSignatureDialog
					onPasted={(html) => {
						setNotice("");
						dispatch({
							type: "settings.save",
							changes: {
								draftSignatureHtml: html,
								draftSignatureOn: true,
							},
						});
					}}
				/>
				{draftSignatureHtml && (
					<Button
						type="button"
						variant="ghost"
						onClick={() =>
							dispatch({
								type: "settings.save",
								changes: { draftSignatureHtml: "" },
							})
						}
					>
						Remove signature
					</Button>
				)}
			</div>
			{notice && (
				<output className="block text-muted-foreground text-sm">
					{notice}
				</output>
			)}
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
		</section>
	);
}

/** Paste the signature from Outlook (Settings > Signatures) with its formatting. */
function PasteSignatureDialog({
	onPasted,
}: {
	onPasted: (html: string) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [hasContent, setHasContent] = useState(false);
	const box = useRef<HTMLDivElement>(null);

	const save = () => {
		const html = sanitizeDraftHtml(box.current?.innerHTML ?? "");
		if (!html.trim()) return;
		onPasted(html);
		setIsOpen(false);
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(next) => {
				setIsOpen(next);
				setHasContent(false);
			}}
		>
			<DialogTrigger asChild>
				<Button type="button" variant="outline">
					Paste my signature
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Paste your signature</DialogTitle>
					<DialogDescription>
						In Outlook, open Settings &gt; Signatures, select your
						signature and copy it, then paste it below. Bold, links
						and sizes are kept.
					</DialogDescription>
				</DialogHeader>
				{/* biome-ignore lint/a11y/useSemanticElements: rich paste needs contentEditable; a textarea drops formatting */}
				<div
					ref={box}
					role="textbox"
					aria-multiline="true"
					aria-label="Signature"
					tabIndex={0}
					contentEditable
					suppressContentEditableWarning
					onInput={() =>
						setHasContent(Boolean(box.current?.textContent?.trim()))
					}
					className="min-h-32 rounded-md border bg-white p-3 text-black outline-none focus-visible:ring-2 focus-visible:ring-ring"
				/>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => setIsOpen(false)}
					>
						Cancel
					</Button>
					<Button type="button" disabled={!hasContent} onClick={save}>
						Use this signature
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
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
