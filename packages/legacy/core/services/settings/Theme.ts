export default interface Theme {
    theme: {
        name: string; // name of the application
        logo: string; // logo of the application
        isLogoUrl: boolean;
        includeNameWithLogo: boolean;
        loginAndSignupTextCustomHtml: string;
        loginCenterHTML: string; // login center content
        loginImage: string; // login image
        isLoginImageUrl: boolean; // if the login image is a URL, otherwise is HTML
        backgroundImage: string;
        homeIntroImage: string; // logo on the popup you see for the first time of login
        isHomeIntroImageUrl: boolean;
        homeIntroObj: {
            infoCards: Array<{
                title: string;
                description: string;
                image: string;
                click: string;
                color: string;
            }>;
            homeIntroHtml: string;
        };
        backgroundImageOpacity: number;
        visualizationBackgroundColor: string;
        visualizationColorPalette: string;
        helpDropdown: {
            showUserGuideSection: boolean;
            showContactUsHeading: boolean;
            showContactUsSection: boolean;
            contactUsIcon: string;
            contactUsLink: string;
            isContactUsLinkUrl: boolean;
            contactUsTitle: string;
            contactUsDescription: string;
            descriptionFontSize: string;
        };
        homeLeftNavItems: {
            preLeftMenuBtnOptions: Array<{
                name: string;
                link: string;
                icon: string;
            }>;
            postLeftMenuBtnOptions: Array<{
                name: string;
                link: string;
                icon: string;
            }>;
        };
    };
    id: string;
    name: string;
    isActive: boolean;
}
