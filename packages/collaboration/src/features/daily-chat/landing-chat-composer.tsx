import { useLocation } from "react-router";
import { LandingChatComposerView } from "./landing-chat-composer-view";
import { useNewChatController } from "./use-new-chat-controller";

/** Start an ordinary conversation from the global overview without opening a room yet. */
export function LandingChatComposer() {
	const location = useLocation();
	const controller = useNewChatController("landing", location.state);
	return <LandingChatComposerView {...controller} />;
}
