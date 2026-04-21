import { Section, type SectionProps } from "./section";
import { SectionHeader, type SectionHeaderProps } from "./section-header";

const SectionNameSpace = Object.assign(Section, {
	Header: SectionHeader,
});

export type { SectionProps, SectionHeaderProps };
export { SectionNameSpace as Section };
