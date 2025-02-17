import React from 'react';
import { Paper, Stack, Typography } from '@semoss/ui';

import AMAZON_S3 from '@/assets/loginProviders/Amazon_S3.png';
import newGoogle from '@/assets/loginProviders/google.png';
import Github from '@/assets/loginProviders/github.png';
import Okta from '@/assets/loginProviders/okta.png';
import Dropbox from '@/assets/loginProviders/dropbox.png';
import ADFS from '@/assets/loginProviders/adfs_microsoft_1.png';
import Gitlab from '@/assets/loginProviders/gitlab.png';
import Keycloak from '@/assets/loginProviders/keycloak.png';
import Linkedin from '@/assets/loginProviders/linkedin.png';
import Microsoft from '@/assets/loginProviders/microsoft.png';
import ProductHunt from '@/assets/loginProviders/product_hunt.png';
import Salesforce from '@/assets/loginProviders/salesforce.png';
import Saml from '@/assets/loginProviders/saml.png';
import Siteminder from '@/assets/loginProviders/siteminder.png';
import Surverymonkey from '@/assets/loginProviders/surveymonkey.png';
import Twitter from '@/assets/loginProviders/x_twitter.png';

import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

const TypeImageObject = {
    native: AMAZON_S3,
    google: newGoogle,
    github: Github,
    okta: Okta,
    dropbox: Dropbox,
    adfs: ADFS,
    gitlab: Gitlab,
    keycloak: Keycloak,
    linkedin: Linkedin,
    ms: Microsoft,
    product_hunt: ProductHunt,
    salesforce: Salesforce,
    saml: Saml,
    siteminder: Siteminder,
    surveymonkey: Surverymonkey,
    twitter: Twitter,
};

interface TeamMembersProviderBannerProps {
    /**
     *
     */
    type: string;
}
export const TeamMembersProviderBanner = (
    props: TeamMembersProviderBannerProps,
) => {
    const { type } = props;

    const lowercase = type.toLowerCase();
    const imgsrc = TypeImageObject[lowercase];

    return (
        <Paper sx={{ width: '100%', padding: '16px' }}>
            <Stack justifyContent={'space-between'} direction={'row'}>
                <Stack>
                    <Typography variant={'h6'}>Members</Typography>
                    <Typography variant={'body2'} color="secondary">
                        Members are managed by the external identity provider
                    </Typography>
                </Stack>
                <Stack alignItems={'center'}>
                    {imgsrc ? (
                        <img
                            src={imgsrc}
                            style={{
                                height: '36px',
                                width: '36px',
                            }}
                        />
                    ) : (
                        <PeopleAltIcon />
                    )}
                    <Typography variant={'caption'} color="secondary">
                        <em>
                            {type.charAt(0).toUpperCase() +
                                type.slice(1).toLowerCase()}
                        </em>
                    </Typography>
                </Stack>
            </Stack>
        </Paper>
    );
};
