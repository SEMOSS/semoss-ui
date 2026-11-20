import type { ReactNode } from "react";
import { useTranslation } from "@semoss/i18n";
import { useSession } from "@semoss/sdk/react";
import { H2, Muted, useTheme } from "@semoss/ui/next";
import { useChatConfig } from "../chat/config/use-chat-config";
import { DropHighlight } from "../conversation/drop-highlight";
import { RoomGreeting } from "../conversation/messages/room-greeting";
import type { RoomStore } from "../room/store/room.store";

/** Props for {@link NewChatLanding}. */
interface NewChatLandingProps {
	/** Show the theme's alternate landing rather than its landing. */
	showAltLanding: boolean;
	/** An agent link's scripted greeting, shown while its room starts; empty for none. */
	greeting: string;
	/** The room the greeting renders for. */
	room: RoomStore;
	/** The composer and what goes with it, below the welcome. */
	children: ReactNode;
}

/**
 * A new chat's landing: the theme's background image, its landing (or a
 * welcome to the user and the theme's description), and an agent's greeting,
 * over the composer. Files dropped anywhere on it attach to the draft.
 */
export const NewChatLanding = ({
	showAltLanding,
	greeting,
	room,
	children,
}: NewChatLandingProps) => {
	const { t } = useTranslation("room");
	const { theme } = useChatConfig();
	const { theme: colorMode } = useTheme();
	const userName = useSession((state) => state.user?.name) ?? "";
	const isDark =
		colorMode === "dark" ||
		(colorMode === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);
	const landingSrc = isDark ? theme.images.landingDark : theme.images.landing;
	return (
		<>
			{landingSrc && (
				<img
					src={landingSrc}
					alt=""
					className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
				/>
			)}
			<DropHighlight className="flex h-full flex-col items-center overflow-auto px-4 py-8 sm:px-6">
				<div className="relative z-10 mx-auto my-auto flex w-full max-w-3xl flex-col gap-6 py-6">
					{theme.landing ? (
						<div
							className="mx-auto flex max-w-xl"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
							dangerouslySetInnerHTML={{
								__html:
									showAltLanding && theme.altLanding
										? theme.altLanding
										: theme.landing,
							}}
						/>
					) : (
						<div className="mx-auto flex max-w-xl flex-col items-center gap-3">
							<H2 className="text-center">
								{t("room:welcome", { name: userName })}
							</H2>
							{theme.description ? (
								<Muted className="text-center">
									{theme.description}
								</Muted>
							) : null}
						</div>
					)}
					{greeting && (
						<RoomGreeting room={room} greeting={greeting} />
					)}
					{children}
				</div>
			</DropHighlight>
		</>
	);
};
