import { Section } from "./section";
import { SectionHeader } from "./section-header";

const SectionNameSpace = Object.assign(Section, {
	Header: SectionHeader,
});
export { SectionNameSpace as Section };
