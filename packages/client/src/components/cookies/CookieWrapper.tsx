import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    List,
    Modal,
    Stack,
    styled,
    Typography,
} from '@semoss/ui';
import { Collapse, Fade } from '@mui/material';
import { useRootStore } from '@/hooks';
import { observer } from 'mobx-react-lite';

const CustomBackdrop = styled(Box)(({ theme }) => ({
    position: 'fixed',
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
    width: '100%',
    height: '100%',
}));

const AcceptCookieContainer = styled(Box)(({ theme }) => ({
    position: 'fixed',
    bottom: 0,
    left: 0,
    zIndex: 1000,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(3),
}));

const StyledPolicyItem = styled(List.ItemButton, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected: boolean }>(({ selected, theme }) => ({
    paddingTop: 0,
    borderTop: selected ? `2px solid ${theme.palette.primary.main}` : ``,
    borderBottom: selected
        ? `2px solid ${theme.palette.primary.main}`
        : `2px solid ${theme.palette.secondary.main}`,
}));

interface CookieWrapperProps {
    /** Content to overlay the Loading Screen on */
    children: React.ReactNode;
}

export const cookieName = `smss-cookies-react-app`;

export const CookieWrapper = observer((props: CookieWrapperProps) => {
    const { children } = props;
    const { configStore } = useRootStore();

    const [visible, setVisible] = useState(true);
    const [viewCookiePolicy, setViewCookiePolicy] = useState(false);

    const [order, setOrder] = useState([]);
    const [policies, setPolicies] = useState({});
    const [message, setMessage] = useState('');
    const [selectedPolicy, setSelectedPolicy] = useState('');

    useEffect(() => {
        const permissionGranted = localStorage.getItem(cookieName);

        if (!permissionGranted) {
            const theme = configStore.store.config['theme'];
            if (theme && theme['THEME_MAP']) {
                try {
                    const themeMap = JSON.parse(theme['THEME_MAP'] as string);

                    const themePolicyOrder = themeMap['cookiePoliciesReact']
                        ? themeMap['cookiePolicyOrderReact']
                        : [];
                    const themePolicies = themeMap['cookiePoliciesReact']
                        ? themeMap['cookiePoliciesReact']
                        : {};
                    const themeMessages = themeMap['cookiePolicyMessageReact']
                        ? themeMap['cookiePolicyMessageReact']
                        : '';

                    if (
                        themePolicyOrder.length &&
                        Object.keys(themePolicies).length
                    ) {
                        setPolicies(themePolicies);
                        setMessage(themeMessages);
                        setSelectedPolicy(themePolicyOrder[0]);
                        setOrder(themePolicyOrder);
                    } else {
                        setVisible(false);
                    }
                } catch {
                    console.error('Unable to parse theme for cookie wrapper');
                }
            } else {
                setVisible(false);
            }
        } else {
            setVisible(false);
        }

        return () => {
            setVisible(true);

            setPolicies({});
            setMessage('');
            setSelectedPolicy('');
            setOrder([]);
        };
    }, [Object.keys(configStore.store.config).length]);

    const acceptCookies = () => {
        localStorage.setItem(cookieName, JSON.stringify(true));

        setViewCookiePolicy(false);
        setVisible(false);
    };

    return (
        <>
            {children}
            {visible && (
                <>
                    <CustomBackdrop />
                    <AcceptCookieContainer>
                        <Stack direction="row" justifyContent={'space-between'}>
                            <Stack direction="column" gap={1}>
                                <Typography variant="body1" fontWeight="bold">
                                    This site uses strictly necessary cookies
                                    and similar technologies to operate this
                                    website and to provide you with a more
                                    personalized user experience
                                </Typography>
                                <Typography variant="body2">
                                    For more information, please review the
                                    Cookie Policy
                                </Typography>
                            </Stack>
                            <Stack direction="row" gap={1}>
                                <Button
                                    variant={'outlined'}
                                    onClick={() => {
                                        // setVisible(false);
                                        setViewCookiePolicy(true);
                                    }}
                                >
                                    View cookie policy
                                </Button>

                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        setVisible(false);
                                        localStorage.setItem(
                                            cookieName,
                                            JSON.stringify(false),
                                        );
                                    }}
                                >
                                    Close
                                </Button>
                            </Stack>
                        </Stack>
                    </AcceptCookieContainer>
                </>
            )}
            <Modal open={viewCookiePolicy} maxWidth="md">
                <Modal.Title>
                    <Stack direction={'column'} gap={1}>
                        <Typography variant="h5">
                            Privacy Preference Center
                        </Typography>
                        <Typography variant="caption">{message}</Typography>
                    </Stack>
                </Modal.Title>
                <Modal.Content>
                    <Stack direction="row" gap={1}>
                        <List sx={{ width: '500px' }}>
                            {order.map((key, i) => {
                                const hasPolicyMessage = key === selectedPolicy;

                                return (
                                    <StyledPolicyItem
                                        key={i}
                                        selected={hasPolicyMessage}
                                        onClick={() => {
                                            setSelectedPolicy(key);
                                        }}
                                    >
                                        <List.ItemText>{key}</List.ItemText>
                                    </StyledPolicyItem>
                                );
                            })}
                        </List>

                        <Stack direction="column" sx={{ width: '100%' }}>
                            <Typography variant="body1">
                                {policies[selectedPolicy]}
                            </Typography>
                        </Stack>
                    </Stack>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="text"
                        onClick={() => {
                            setVisible(false);
                            setViewCookiePolicy(false);
                            localStorage.setItem(
                                cookieName,
                                JSON.stringify(false),
                            );
                        }}
                    >
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={acceptCookies}>
                        Accept
                    </Button>
                </Modal.Actions>
            </Modal>
        </>
    );
});

const UPDATE_COOKIE_WITH_THEME = `
UPDATE ADMIN_THEME
SET THEME_MAP= '{"name":"CFG.AI","logo":"","isLogoUrl":false,"includeNameWithLogo":true,"loginAndSignupTextCustomHtml":"","loginCenterHTML":"","loginImage":"","isLoginImageUrl":true,"backgroundImage":"","homeIntroImage":"",
"isHomeIntroImageUrl":false,"homeIntroObj":{"infoCards":[{"title":"%theme.name% 101","description":"What %theme.name% is and how to leverage it for intelligent business","image":"logo","click":"101","color":"blue"},{"title":"Use Cases","description":"Explore how %theme.name% helps solve real-world business problems","image":"briefcase","click":"uses","color":"purple"}],"homeIntroHtml":""},"backgroundImageOpacity":0.95,"visualizationBackgroundColor":"#FFFFFF","visualizationColorPalette":"Two","helpDropdown":{"showUserGuideSection":true,"showContactUsHeading":true,"showContactUsSection":true,"contactUsIcon":"","contactUsLink":"semoss@semoss.org","isContactUsLinkUrl":false,"contactUsTitle":"Email Us","contactUsDescription":"","descriptionFontSize":"regular"},"homeLeftNavItems":{"preLeftMenuBtnOptions":[],"postLeftMenuBtnOptions":[]}, 
"cookiePolicyMessageReact": "We use cookies and similar technologies to improve your experience, personalize content, and analyze usage patterns on this website. By using our services, you agree to the use of cookies as described in this policy.",
"cookiePolicyOrderReact":["Strictly Necessary Cookies","Performance Cookies","Functional Cookies","Targeting or Advertising Cookies"], 
"cookiePoliciesReact": {"Targeting or Advertising Cookies":"We may use these cookies to deliver advertisements that are more relevant to your interests. They may also limit the number of times you see an ad and help measure the effectiveness of advertising campaigns. These cookies track your browsing habits to understand your interests.","Functional Cookies": "Functional cookies allow the website to remember choices you make (such as language preference or region) and provide enhanced, more personalized features. These cookies may also be used to remember changes you have made to the text size, fonts, and other parts of the webiste that you can customize.", "Performance Cookies": "These cookies collect information about how visitors use our site, such as which pages are used most often.  The data collected is used to improves the sites performance and ensure a smooth user experience.  All information gathered by these cookies is aggregated and anonymous", "Strictly Necessary Cookies": "These cookies are essential for you to browse the website and use its features, such as accessing secure areas. Without these cookies, services like LLM usage or secure logins cannot be provided."},
"termsReact": "Please be advised that the use of Large Language Models (LLMs) in this application may be subject to specific guidelines or restrictions based on your organization’s policies. Before proceeding, we recommend consulting with your member firm for guidance on the appropriate use of LLMs to ensure compliance with relevant regulations and best practices.", 
"materialTheme":{"palette":{"mode":"light","primary":{"main":"#26890D","dark":"#86BC25","light":"#046A38","hover":"#F5F9FE","selected":"#EBF4FE","border":"#9FCFFF"},"secondary":{"main":"#D9D9D9","dark":"#757575","light":"#F2F2F2"},"text":{"primary":"#000000","main":"#000000","secondary":"#666666","disabled":"#9E9E9E"},"error":{"main":"#DA291C","light":"#FBE9E8","dark":"#BF0D02"},"warning":{"main":"#FA9F2C","light":"#FDF0E5","dark":"#EF8326"},"info":{"main":"#0471F0","light":"#22A4FF","dark":"#1260DD"},"success":{"main":"#348700","light":"#EAF2EA","dark":"#006500"},"background":{"paper":"#FFFFFF","default":"#FAFAFA"},"primaryContrast":{"50":"#E7F4E5","100":"#C6E4BF","200":"#A1D396","300":"#7AC36B","400":"#5CB649","500":"#3EA924","600":"#349B1B","700":"#26890D","800":"#167800","900":"#005A00","shadow":"#E7F4E5"},"green":{"50":"#DEF4F3","100":"#ABE4E0","200":"#6FD4CB","300":"#07C2B6","400":"#00B4A4","500":"#00A593","600":"#009785","700":"#008674","800":"#007664","900":"#005946"},"darkBlue":{"50":"#EAE4F2","100":"#C9BCE0","200":"#A690CC","300":"#8364B8","400":"#6944AA","500":"#4F249B","600":"#471F96","700":"#3A188E","800":"#2D1286","900":"#150578"},"pink":{"50":"#FFE6F0","100":"#FFC0D9","200":"#FF97C0","300":"#FF6DA6","400":"#FF4E90","500":"#FF337B","600":"#ED2F77","700":"#D62C71","800":"#C0286C","900":"#992263"},"purple":{"50":"#F1E9FB","100":"#DAC9F5","200":"#C3A5F0","300":"#AA7EEA","400":"#975FE4","500":"#8340DE","600":"#783BD7","700":"#6A32CE","800":"#5D2BC7","900":"#481EB8"}},"shape":{"borderRadiusNone":0,"borderRadius":12,"borderRadiusSm":4,"borderRadiusLg":20,"borderRadiusCircle":64,"borderRadiusChip":64},"spacing":8,"typography":{"fontFamily":"\"Inter\", sans-serif","body1":{"fontSize":"16px","fontStyle":"normal","fontWeight":"400","lineHeight":"150%","letterSpacing":"0.15px"},"body2":{"fontSize":"14px","fontStyle":"normal","fontWeight":"400","lineHeight":"143%","letterSpacing":"0.17px"},"subtitle1":{"fontSize":"16px","fontStyle":"normal","fontWeight":"400","lineHeight":"175%","letterSpacing":"0.15px"},"subtitle2":{"fontSize":"14px","fontStyle":"normal","fontWeight":"500","lineHeight":"157%","letterSpacing":"0.1px"},"caption":{"fontSize":"12px","fontStyle":"normal","fontWeight":"400","lineWeight":"166%","letterSpacing":"0.4px"},"overline":{"fontSize":"12px","fontStyle":"normal","fontWeight":"400","lineHeight":"266%","letterSpacing":"1px","textTransform":"uppercase"},"h1":{"fontSize":"96px","fontStyle":"normal","fontWeight":"300","lineHeight":"116.7%","letterSpacing":"-1.5px","textTransform":"none"},"h2":{"fontSize":"60px","fontStyle":"normal","fontWeight":"300","lineHeight":"120%","letterSpacing":"-0.5px","textTransform":"none"},"h3":{"fontSize":"48px","fontStyle":"normal","fontWeight":"400","lineHeight":"116.7%","textTransform":"none"},"h4":{"fontSize":"34px","fontStyle":"normal","fontWeight":"400","lineHeight":"123.5%","letterSpacing":"0.25px","textTransform":"none"},"h5":{"fontSize":"24px","fontStyle":"normal","fontWeight":"500","lineHeight":"133.4%","textTransform":"none"},"h6":{"fontSize":"20px","fontStyle":"normal","fontWeight":"500","lineHeight":"160%","letterSpacing":"0.15px","textTransform":"none"},"button":{"textTransform":"none","fontWeight":"600"}},"components":{"MuiCssBaseline":{},"MuiAlertTitle":{"styleOverrides":{}},"MuiContainer":{"styleOverrides":{"maxWidthSm":{"maxWidth":200},"maxWidthMd":{"maxWidth":320},"maxWidthLg":{"maxWidth":500},"maxWidthXl":{"maxWidth":1271}}},"MuiCard":{"styleOverrides":{}},"MuiCardHeader":{"styleOverrides":{}},"MuiCardContent":{"styleOverrides":{}},"MuiCardActions":{"styleOverrides":{}},"MuiPaper":{"styleOverrides":{}},"MuiButton":{"styleOverrides":{}}}}}'
WHERE id='8199b972-0bd3-4764-8a1a-d00cd1e4c563';
`;
