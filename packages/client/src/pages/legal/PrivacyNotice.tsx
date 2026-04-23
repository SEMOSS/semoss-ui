import { observer } from "mobx-react-lite";
import { useRootStore } from "@/hooks";
import { LegalPage } from "./components/legal-page";

export const PrivacyNotice = observer(() => {
	const { configStore } = useRootStore();

	const html = configStore.theme.privacyNoticePage;

	return (
		<LegalPage>
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: server-controlled legal HTML */}
			<div dangerouslySetInnerHTML={{ __html: html }} />
		</LegalPage>
	);
});
