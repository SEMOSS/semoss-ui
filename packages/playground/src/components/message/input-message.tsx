import { CopyIcon, FileIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
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
		return (
			<div className="group">
				<div className="ml-auto max-w-[600px] items-start self-stretch rounded-lg bg-accent px-5 py-4 leading-normal">
					{message.parts.map((p, pIdx) => {
						if (p.type === "TEXT") {
							return (
								<span
									key={`${message.id}-part-${pIdx}`}
									className="text-base text-foreground"
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
				<div className="ml-auto flex max-w-[600px] justify-end pt-2 opacity-0 transition-opacity group-hover:opacity-100">
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
												return `<${part.toolCall.toolName}?`;
											}

											return "";
										})
										.join("\n");

									if (!text) {
										toast.warning("No content to copy");
										return;
									}

									try {
										navigator.clipboard.writeText(text);

										toast.success(
											"Successfully copied to clipboard",
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
							Copy Message
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		);
	},
);
