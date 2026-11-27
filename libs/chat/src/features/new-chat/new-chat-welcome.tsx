import { useTranslation } from "@semoss/i18n";
import { useSession } from "@semoss/sdk/react";
import { H2, Muted } from "@semoss/ui/next";

/** Props for {@link NewChatWelcome}. */
interface NewChatWelcomeProps {
	/**
	 * The host's own welcome as HTML, from a source it trusts, shown in place
	 * of the chat's. Empty for the chat's.
	 */
	html?: string;
	/** A line under the chat's welcome. Empty for none. */
	description?: string;
}

/**
 * A new chat's welcome above the composer (`NewChat`'s `welcome`): the
 * chat's welcome to the user with an optional line under it, or the host's
 * own HTML.
 */
export const NewChatWelcome = ({
	html = "",
	description = "",
}: NewChatWelcomeProps) => {
	const { t } = useTranslation("room");
	const userName = useSession((state) => state.user?.name) ?? "";
	if (html) {
		return (
			<div
				className="mx-auto flex max-w-xl"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: the host's own HTML, from a source it trusts
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		);
	}
	return (
		<div className="mx-auto flex max-w-xl flex-col items-center gap-3">
			<H2 className="text-center">
				{t("room:welcome", { name: userName })}
			</H2>
			{description ? (
				<Muted className="text-center">{description}</Muted>
			) : null}
		</div>
	);
};
