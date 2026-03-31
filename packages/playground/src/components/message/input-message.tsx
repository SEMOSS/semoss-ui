import { CopyIcon, FileIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import type { InputMessageStore, RoomStore } from "@/stores";

interface InputMessageProps {
	/** Room */
	room: RoomStore;

	/** Message to render */
	message: InputMessageStore;
}

export const InputMessage: React.FC<InputMessageProps> = observer(
	({ room, message }) => {
		const { t } = useTranslation("chat");

		return (
			<div className="group ml-auto flex max-w-[600px] flex-col items-end">
				<div className="items-start self-stretch rounded-lg bg-accent px-4 py-3 leading-normal">
					{message.parts.map((p, pIdx) => {
						if (p.type === "TEXT") {
							return (
								<span
									key={`${message.id}-part-${pIdx}`}
									className="text-foreground text-small"
								>
									{p.text}
								</span>
							);
						} else if (p.type === "MEDIA") {
							return (
								<div key={`${message.id}-part-${pIdx}`}>
									<button
										type="button"
										className="group relative flex size-22 cursor-pointer flex-row items-center justify-center overflow-hidden rounded-md border border-border bg-muted"
										onClick={() => {
											// this will select if there or open if not
											room.addSidebarNode(
												`FILE--${p.mediaInfo.fileLocation}`,
												{
													type: "tab",
													name: p.mediaInfo.fileName,
													component:
														"room-file-editor",
													config: {
														name: p.mediaInfo
															.fileName,
														path: p.mediaInfo
															.fileLocation,
													},
													enableClose: true,
												},
											);
										}}
										aria-label={`View ${p.mediaInfo.fileName}`}
									>
										{p.mediaInfo.mimeType?.startsWith(
											"image/",
										) ? (
											<img
												className="w-full"
												src={`data:image/png;base64,${p.mediaInfo.base64Data}`}
												alt={p.mediaInfo.fileName}
											/>
										) : (
											<FileIcon className="size-6 text-muted-foreground" />
										)}
									</button>
								</div>
							);
						}

						return null;
					})}
				</div>
				<div className="flex flex-row items-center gap-0.5 pt-2 opacity-0 transition-opacity group-hover:opacity-100">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								disabled={message.parts.length === 0}
								onClick={() => {
									const text = message.parts
										.map((part) => {
											if (part.type === "TEXT") {
												return part.text;
											} else if (part.type === "MEDIA") {
												return `<${part.mediaInfo.fileName}?`;
											} else if (
												part.type === "TOOL_RESULT"
											) {
												return `<${part.toolResult.toolName}?`;
											}

											return "";
										})
										.join("\n");

									if (!text) {
										toast.warning(
											t("notifications.noCopyContent"),
										);
										return;
									}

									try {
										navigator.clipboard.writeText(text);

										toast.success(
											t("notifications.copySuccess"),
										);
									} catch (e) {
										toast.error(e.message);
									}
								}}
							>
								<CopyIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{t("input.copyMessage")}
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		);
	},
);
