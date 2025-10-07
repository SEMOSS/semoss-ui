import { Modal, type ModalProps } from "./Modal";
import { ModalActions, type ModalActionsProps } from "./ModalActions";
import { ModalContent, type ModalContentProps } from "./ModalContent";
import {
	ModalContentText,
	type ModalContentTextProps,
} from "./ModalContentText";
import { ModalTitle, type ModalTitleProps } from "./ModalTitle";

const ModalNameSpace = Object.assign(Modal, {
	Content: ModalContent,
	Title: ModalTitle,
	Actions: ModalActions,
	ContentText: ModalContentText,
});

export type {
	ModalProps,
	ModalContentProps,
	ModalTitleProps,
	ModalActionsProps,
	ModalContentTextProps,
};

export { ModalNameSpace as Modal };
