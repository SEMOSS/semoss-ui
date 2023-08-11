import { Tabs, TabsProps } from "./Tabs";
import { Tab, TabProps } from "./Tab";

const TabsNameSpace = Object.assign(Tabs, {
    Item: Tab,
});

export type { TabsProps, TabProps };

export { TabsNameSpace as Tabs };
export { Tab };
