import MuiPhoneNumber from "mui-phone-number";
import React from "react";

export type PhoneNumberPickerProps = {
    //** abbrv to be passed in to select default country */
    defaultCountry?: string;

    //** if true, the country code will be disabled*/
    disableCountryCode?: boolean;

    //** if true, dropdown will be disabled */
    disableDropdown?: boolean;

    //** array of countries to exclude from dropdown list */
    excludeCountries?: string[];

    //** function to fire when input changes */
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

    //** set the regions */
    regions?: [string] | string;
};

export const PhoneNumberPicker = (props: PhoneNumberPickerProps) => {
    return <MuiPhoneNumber variant="outlined" {...props} />;
};
