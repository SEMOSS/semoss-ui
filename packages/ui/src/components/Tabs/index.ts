import { Tabs as _Tabs, TabsProps } from "./Tabs";
import { Tab, TabProps } from "./Tab";

const TabsNameSpace = Object.assign(_Tabs, {
    Item: Tab,
});

export type { TabsProps, TabProps };

export { TabsNameSpace as Tabs };
export { Tab };
