import { Breadcrumbs, BreadcrumbsProps } from "./Breadcrumbs";
import { Link, LinkProps } from "../Link";

export type { BreadcrumbsProps, LinkProps };

const BreadCrumbsNameSpace = Object.assign(Breadcrumbs, {
    Item: Link,
});

export { BreadCrumbsNameSpace as Breadcrumbs };
