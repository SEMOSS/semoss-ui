import { Modal, ModalProps } from "./Modal";
import { ModalContent, ModalContentProps } from "./ModalContent";
import { ModalTitle, ModalTitleProps } from "./ModalTitle";
import { ModalActions, ModalActionsProps } from "./ModalActions";
import { ModalContentText, ModalContentTextProps } from "./ModalContentText";

const CardNameSpace = Object.assign(Modal, {
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

export { CardNameSpace as Modal, ModalContent };
