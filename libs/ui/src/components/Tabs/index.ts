import { Tab, type TabProps } from "./Tab";
import { Tabs, type TabsProps } from "./Tabs";

const TabsNameSpace = Object.assign(Tabs, {
	Item: Tab,
});

export type { TabsProps, TabProps };

export { TabsNameSpace as Tabs };
export { Tab };
