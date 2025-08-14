import { observer } from "mobx-react-lite";
import { useRootStore } from "@/hooks";
import { LegalPage } from "./components/legalPage";

export const PrivacyNotice = observer(() => {
	const { configStore } = useRootStore();

	const html = configStore.theme.privacyNoticePage;

	return (
		<LegalPage>
			<div dangerouslySetInnerHTML={{ __html: html }} />
		</LegalPage>
	);
});
