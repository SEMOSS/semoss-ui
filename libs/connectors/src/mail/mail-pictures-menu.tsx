import { ImageIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import {
	parseMailPicturePreference,
	useMailPicturePreference,
} from "./use-mail-picture-preference";

/**
 * Which pictures every email shows without being asked, chosen from a small
 * button beside an email's date. The choice is the viewer's, so it applies to
 * every email at once, and an email keeps showing what it already shows.
 */
export const MailPicturesMenu = () => {
	const { t } = useTranslation("connectors");
	const { preference, setPreference } = useMailPicturePreference();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="size-7 shrink-0 text-muted-foreground"
					aria-label={t("mail.pictureSettings")}
					title={t("mail.pictureSettings")}
				>
					<ImageIcon aria-hidden className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>
					{t("mail.picturesInEmails")}
				</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					value={preference}
					onValueChange={(value) =>
						setPreference(parseMailPicturePreference(value))
					}
				>
					<DropdownMenuRadioItem value="ask">
						{t("mail.picturesAsk")}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="embedded">
						{t("mail.picturesEmbedded")}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="all">
						{t("mail.picturesAll")}
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
