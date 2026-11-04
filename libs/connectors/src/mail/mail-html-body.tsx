import { ImageOffIcon } from "lucide-react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useState,
} from "react";
import { useTranslation } from "@semoss/i18n";
import { Button, cn, Muted } from "@semoss/ui/next";
import type { MailEmbeddedImages } from "./mail.types";
import { buildMailHtmlDocument } from "./mail-html";
import { useMailPicturePreference } from "./use-mail-picture-preference";

/** How tall the frame is before the email in it has been measured. */
const MIN_FRAME_HEIGHT = 80;

/** The tallest the frame grows, so a runaway email cannot take over the page. */
const MAX_FRAME_HEIGHT = 20_000;

/** Where a read of the pictures an email embeds stands. */
type EmbeddedRead =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "ready"; result: MailEmbeddedImages }
	| { status: "error" };

/** Props for {@link MailHtmlBody}. */
export interface MailHtmlBodyProps {
	/** The email's HTML body, as its mailbox sent it. */
	html: string;
	/** Names the frame the email is shown in, for screen readers. */
	title: string;
	/** What shows instead when the HTML has nothing to show, such as the email's text. */
	fallback: ReactNode;
	/**
	 * Reads the pictures the email embeds from its mailbox, once the reader
	 * shows them or has chosen to always see them. A new function reads them
	 * again, so it stays the same while the email does. Without it, embedded
	 * pictures stay placeholders.
	 */
	onLoadEmbeddedImages?: () => Promise<MailEmbeddedImages>;
}

/**
 * An email shown the way its mail app shows it, with its own layout, colors,
 * and fonts, in a frame of its own that runs no script and loads nothing
 * until the reader asks, as Outlook holds pictures back: the pictures the
 * email embeds come from its mailbox, and those on the web from the internet,
 * each when the reader shows them or as the reader chose for every email. The
 * history the email quotes is left out until the reader shows it, so a thread
 * reads one email at a time.
 */
export const MailHtmlBody = ({
	html,
	title,
	fallback,
	onLoadEmbeddedImages,
}: MailHtmlBodyProps) => {
	const { t } = useTranslation("connectors");
	const { preference } = useMailPicturePreference();
	const [isRemoteRequested, setIsRemoteRequested] = useState(false);
	const [isEmbeddedRequested, setIsEmbeddedRequested] = useState(false);
	// a new choice for every email, made in the picture settings, leaves what
	// this one already shows, whichever way it goes
	const [shownPreference, setShownPreference] = useState(preference);
	if (shownPreference !== preference) {
		setShownPreference(preference);
		if (shownPreference === "all") {
			setIsRemoteRequested(true);
		}
		if (shownPreference !== "ask") {
			setIsEmbeddedRequested(true);
		}
	}
	const [embeddedRead, setEmbeddedRead] = useState<EmbeddedRead>({
		status: "idle",
	});
	const [attempt, setAttempt] = useState(0);
	const [isQuotedHistoryShown, setIsQuotedHistoryShown] = useState(false);
	const [height, setHeight] = useState(MIN_FRAME_HEIGHT);
	const frameId = useId();
	const remoteImageLabel = t("mail.remoteImage");
	const embeddedImageLabel = t("mail.embeddedImage");
	const imageLabel = t("mail.image");
	const isRemoteImagesShown = isRemoteRequested || preference === "all";
	const embeddedImages =
		embeddedRead.status === "ready"
			? embeddedRead.result.images
			: undefined;
	const built = useMemo(
		() =>
			buildMailHtmlDocument(html, {
				isRemoteImagesShown: isRemoteImagesShown,
				isQuotedHistoryShown: isQuotedHistoryShown,
				embeddedImages: embeddedImages,
				labels: {
					remoteImage: remoteImageLabel,
					embeddedImage: embeddedImageLabel,
					image: imageLabel,
				},
			}),
		[
			html,
			isRemoteImagesShown,
			isQuotedHistoryShown,
			embeddedImages,
			remoteImageLabel,
			embeddedImageLabel,
			imageLabel,
		],
	);
	const wantsEmbedded =
		built.hasEmbeddedImages &&
		onLoadEmbeddedImages !== undefined &&
		(isEmbeddedRequested || preference !== "ask");
	// a read given up on, when the choice changed while it ran, can start again
	const embeddedStatus =
		embeddedRead.status === "loading" && !wantsEmbedded
			? "idle"
			: embeddedRead.status;

	// attempt is not read: a new value is the signal to read again
	// biome-ignore lint/correctness/useExhaustiveDependencies: retry trigger
	useEffect(() => {
		if (!wantsEmbedded || !onLoadEmbeddedImages) {
			return;
		}
		let isCancelled = false;
		setEmbeddedRead({ status: "loading" });
		onLoadEmbeddedImages().then(
			(result) => {
				if (!isCancelled) {
					setEmbeddedRead({ status: "ready", result: result });
				}
			},
			() => {
				if (!isCancelled) {
					setEmbeddedRead({ status: "error" });
				}
			},
		);
		return () => {
			isCancelled = true;
		};
	}, [wantsEmbedded, onLoadEmbeddedImages, attempt]);

	// the frame runs no script, so it is measured from here each time its
	// document loads and whenever its body changes size
	const measureFrame = useCallback((frame: HTMLIFrameElement | null) => {
		if (!frame) {
			return;
		}
		let observer: ResizeObserver | undefined;
		const measure = () => {
			const frameBody = frame.contentDocument?.body;
			if (frameBody) {
				setHeight(
					Math.max(
						MIN_FRAME_HEIGHT,
						Math.ceil(frameBody.getBoundingClientRect().height),
					),
				);
			}
		};
		const handleLoad = () => {
			observer?.disconnect();
			const frameBody = frame.contentDocument?.body;
			if (!frameBody) {
				return;
			}
			observer = new ResizeObserver(measure);
			observer.observe(frameBody);
			measure();
		};
		frame.addEventListener("load", handleLoad);
		handleLoad();
		return () => {
			frame.removeEventListener("load", handleLoad);
			observer?.disconnect();
		};
	}, []);

	if (!built.hasContent) {
		return fallback;
	}

	const isRemoteHidden = built.hasRemoteImages && !isRemoteImagesShown;
	const isEmbeddedHidden =
		built.hasEmbeddedImages && embeddedStatus !== "ready";
	const omitted =
		embeddedRead.status === "ready" ? embeddedRead.result.omitted : 0;
	const hiddenText = isRemoteHidden
		? t("mail.picturesHidden")
		: isEmbeddedHidden
			? t("mail.embeddedPicturesHidden")
			: "";
	const statusText =
		embeddedStatus === "loading"
			? t("mail.embeddedPicturesLoading")
			: embeddedStatus === "error"
				? t("mail.embeddedPicturesFailed")
				: omitted > 0
					? t("mail.embeddedPicturesOmitted", { count: omitted })
					: "";

	return (
		<div className="flex min-w-0 flex-col gap-2">
			{/* mounted with the email, so a change in it is announced */}
			{built.hasEmbeddedImages || built.hasRemoteImages ? (
				<output className="sr-only">{statusText}</output>
			) : null}
			{/* only while something is held back or there is news of it, so
			    an email showing all its pictures has no bar */}
			{hiddenText !== "" || statusText !== "" ? (
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border border-border bg-muted/30 px-3 py-1.5">
					{hiddenText ? (
						<>
							<ImageOffIcon
								aria-hidden
								className="size-4 shrink-0 text-muted-foreground"
							/>
							<Muted className="min-w-0 flex-1 basis-40 text-xs">
								{hiddenText}
							</Muted>
						</>
					) : null}
					{isEmbeddedHidden && onLoadEmbeddedImages ? (
						embeddedStatus === "error" ? (
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs"
								aria-controls={frameId}
								onClick={() =>
									setAttempt((previous) => previous + 1)
								}
							>
								{t("common.retry")}
							</Button>
						) : (
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs"
								aria-controls={frameId}
								aria-busy={embeddedStatus === "loading"}
								disabled={embeddedStatus === "loading"}
								onClick={() => setIsEmbeddedRequested(true)}
							>
								{embeddedStatus === "loading"
									? t("mail.loadingPictures")
									: t("mail.showEmbeddedPictures")}
							</Button>
						)
					) : null}
					{isRemoteHidden ? (
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs"
							aria-controls={frameId}
							onClick={() => setIsRemoteRequested(true)}
						>
							{t("mail.showWebPictures")}
						</Button>
					) : null}
					{statusText !== "" ? (
						<span
							aria-hidden
							className={cn(
								"block basis-full font-medium text-muted-foreground text-xs",
								embeddedStatus === "error" &&
									"text-destructive",
							)}
						>
							{statusText}
						</span>
					) : null}
				</div>
			) : null}
			<iframe
				ref={measureFrame}
				id={frameId}
				title={title}
				srcDoc={built.html}
				sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
				referrerPolicy="no-referrer"
				className="block w-full rounded-md border border-border"
				// the frame is as tall as the email it holds, which only
				// measuring its document can tell
				style={{ height: Math.min(height, MAX_FRAME_HEIGHT) }}
			/>
			{built.hasQuotedHistory ? (
				<Button
					variant="ghost"
					size="sm"
					className="self-start"
					aria-pressed={isQuotedHistoryShown}
					aria-controls={frameId}
					onClick={() =>
						setIsQuotedHistoryShown((previous) => !previous)
					}
				>
					{isQuotedHistoryShown
						? t("mail.hideQuoted")
						: t("mail.showQuoted")}
				</Button>
			) : null}
		</div>
	);
};
