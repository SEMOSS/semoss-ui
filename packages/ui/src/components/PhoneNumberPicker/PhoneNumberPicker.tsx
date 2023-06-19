import MuiPhoneNumber, { MuiPhoneNumberProps } from "mui-phone-number";

export type PhoneNumberPickerProps = MuiPhoneNumberProps;

export const PhoneNumberPicker = (props: PhoneNumberPickerProps) => {
    return <MuiPhoneNumber {...props} />;
};
