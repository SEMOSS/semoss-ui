import {
    Card,
    Chip,
    Typography,
    styled,
    IconButton,
    Link,
    CardProps,
} from '@semoss/ui';
import { AccessTime } from '@mui/icons-material';
import { AppMetadata } from './app.types';
import { removeUnderscores } from '@/utility';
import React from 'react';
import Agent_Builder from '@/assets/img/Agent_Builder.svg';
import DragAndDrop from '@/assets/img/DragAndDrop.svg';
import Pro_Code from '@/assets/img/Pro_Code.svg';
import RemoveRedEyeFilled from '@/assets/img/RemoveRedEyeFilled.svg';
import AgentBuilderImage from '@/assets/img/AgentBuilder.png';
import DragAndDropImage from '@/assets/img/DragDrop.png';
import ProCodeImage from '@/assets/img/ProCode.png';

const StyledName = styled(Typography)(() => ({
    fontWeight: 400,
    color: '#212121',
    fontFamily: 'Inter',
    fontSize: '14px',
    fontStyle: 'normal',
    lineHeight: '143%',
    letterSpacing: '0.17px',
}));

const StyledTileCard = styled(
    React.forwardRef<HTMLDivElement, CardProps & { disabled: boolean }>(
        ({ disabled, ...props }, ref) => (
            <div ref={ref}>
                <Card {...props} />
            </div>
        ),
    ),
)<{ disabled: boolean }>(({ disabled, theme }) => ({
    height: '269px',
    width: '316px',
    '&:hover': {
        cursor: disabled ? 'default' : 'pointer',
    },
    borderRadius: theme.shape.borderRadius,
}));

const StyledContainer = styled('div')({
    position: 'relative',
});

const StyledOverlayContent = styled('div')(() => ({
    // width: '100%',
    // height: '134px',
    position: 'absolute',
    top: '0',
    right: '0',
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '8px',
    paddingRight: '10px',
}));

const StyledTileCardMedia = styled(Card.Media)({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    alignSelf: 'stretch',
    overflowClipMargin: 'content-box',
    overflow: 'clip',
    objectFit: 'cover',
    width: '283px',
    height: '123px',
});
const StyledCardDescription = styled(Typography)(({ theme }) => ({
    margin: 0,
    fontSize: '12px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '19.92px',
    letterSpacing: '0.4px',
    fontFamily: 'Roboto',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordWrap: 'break-word',
    color: '#666',
    height: '40px',
}));

const StyledCardHeader = styled(Card.Header)(({ theme }) => ({
    '&.MuiCardHeader-root': {
        padding: '0px',
        margin: '0px',
        height: '20px',
    },
    '.MuiCardHeader-title': {
        width: '200px',
    },
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
}));

const ButtonName = styled('p')(({ theme }) => ({
    fontSize: '13px',
    color: '#fff',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: '22px',
    letterSpacing: '0.46px',
}));

const StyledCardContent = styled(Card.Content)(({ theme }) => ({
    '&.MuiCardContent-root': {
        padding: '0px',
        margin: '0px',
        gap: '0px',
    },
}));

const StyledCardActions = styled(Card.Actions)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    '&.MuiCardActions-root': {
        padding: '0px',
        position: 'relative',
    },
    height: '30px',
    width: '284px',
    gap: '40px',
});

const StyledIconButton = styled(IconButton)({
    backgroundColor: '#EBEBEB',
    height: '28px',
    width: '28px',
    radius: '24px',
    '&:hover': {
        backgroundColor: '#EBEBEB',
        $icon: {
            color: 'red',
        },
    },
});

const StyledOpenButton = styled(IconButton)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    '&.MuiIconButton-root': {
        padding: '0px',
    },
}));

const StyledMainDiv = styled('div')(({ theme }) => ({
    width: '316px',
    height: '292px',
}));

const StyledContent = styled('div')(({ theme }) => ({
    display: 'flex',
    padding: '8px 16px',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-start',
    height: '80px',
}));

const StyledFooterDiv = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    height: '30px',
    width: '123px',
    gap: '8px',
    justifyContent: 'center',
    // flex: '1 0 0',
    borderRadius: '12px',
    background: '#0471F0',
}));

const StyledParentImageDiv = styled('div')(({ theme }) => ({
    display: 'flex',
    padding: '16px 16.79px 0px 16px',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    height: '138px',
    width: '100%',
}));

const StyledCardContentDiv = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    alignself: 'stretch',
}));

const StyledFooter1Div = styled('div')(({ theme }) => ({
    display: 'flex',
    padding: '8px 16px',
    alignItems: 'center',
    gap: '40px',
    alignSelf: 'stretch',
    borderTop: '1px solid var(--Secondary-Divider, #E6E6E6)',
    background: '#fff',
    height: '30px',
    width: '100%',
}));

interface BrowseTemplateTileCardProps {
    /**
     * App
     */
    app: AppMetadata;

    /**
     * Background
     */
    background?: string;

    /**
     * Action that is triggered when clicked
     * aop - current selected app
     */
    onAction?: () => void;

    /**
     * Link to navigate to
     */
    href?: string;

    /**
     * is app favorited
     */
    isFavorite?: boolean;

    /**
     * toggle favorite bookmark
     */
    favorite?: (value: boolean) => void;

    /**
     * type of app to match image
     */
    appType?: string;

    /**
     * is the app a default system app
     */
    systemApp?: boolean;

    /**
     * Show bookmark
     */
    isDiscoverable?: boolean;

    /**
     * Action triggered when deleted
     */
    onDelete?: () => void;

    /**
     * Whether the card is loading (shows skeleton)
     */
    isLoading?: boolean;
    /**
     * Whether to show the skeleton loader
     */
    showSkeleton?: boolean;
}

export const BrowseTemplateTileCard = (props: BrowseTemplateTileCardProps) => {
    const {
        app,
        background = '#DAC9F5',
        onAction = () => null,
        href = null,
        isFavorite,
        favorite,
        appType,
        systemApp,
        isDiscoverable = false,
        onDelete,
        isLoading,
        showSkeleton,
    } = props;

    return (
        <StyledMainDiv>
            <StyledTileCard disabled>
                <StyledContainer>
                    <StyledOverlayContent>
                        <StyledIconButton size="small" color="default">
                            <img src={RemoveRedEyeFilled}></img>
                        </StyledIconButton>
                    </StyledOverlayContent>
                </StyledContainer>
                <Link
                    href={href}
                    rel="noopener noreferrer"
                    color="inherit"
                    underline="none"
                >
                    <StyledParentImageDiv
                        style={{
                            background:
                                app.project_type === 'BLOCKS'
                                    ? '#BAB5F4'
                                    : app.project_type === 'CODE'
                                    ? '#8CD98D'
                                    : '#93CEF8',
                        }}
                    >
                        <StyledTileCardMedia
                            src="img"
                            image={
                                app.project_type === 'BLOCKS'
                                    ? DragAndDropImage
                                    : app.project_type === 'CODE'
                                    ? ProCodeImage
                                    : AgentBuilderImage
                            }
                        />
                    </StyledParentImageDiv>
                    <StyledContent>
                        <StyledCardContentDiv>
                            <StyledCardHeader
                                title={
                                    <StyledName variant={'body2'}>
                                        {removeUnderscores(app.project_name)}
                                    </StyledName>
                                }
                            />
                            <StyledCardContent>
                                <StyledCardDescription variant={'caption'}>
                                    {app.description
                                        ? app.description
                                        : 'No description available'}
                                </StyledCardDescription>
                            </StyledCardContent>
                        </StyledCardContentDiv>
                    </StyledContent>
                    <StyledFooter1Div>
                        <StyledCardActions>
                            <div style={{ display: 'flex' }}>
                                <div
                                    style={{
                                        width: '161px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        borderRadius: '4px',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            height: '30px',
                                            padding: '4px 5px',
                                            gap: '8px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                height: '18px',
                                                flexDirection: 'column',
                                                position: 'relative',
                                                top: '2px',
                                            }}
                                        >
                                            <img
                                                src={
                                                    app.project_type ===
                                                    'BLOCKS'
                                                        ? DragAndDrop
                                                        : app.project_type ===
                                                          'CODE'
                                                        ? Pro_Code
                                                        : Agent_Builder
                                                }
                                                alt={
                                                    app.project_type ===
                                                    'BLOCKS'
                                                        ? 'Drag and Drop'
                                                        : app.project_type ===
                                                          'CODE'
                                                        ? 'Pro Code'
                                                        : 'Agent Builder'
                                                }
                                                style={{
                                                    height: '16px',
                                                    width: '16px',
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                color: '#9E9E9E',
                                                fontFamily: 'Inter',
                                                fontSize: '12px',
                                                fontWeight: '400',
                                                lineHeight: '19.92px',
                                                letterSpacing: '0.4px',
                                                fontStyle: 'normal',
                                            }}
                                        >
                                            {app.project_type === 'BLOCKS'
                                                ? 'Drag and Drop'
                                                : app.project_type === 'CODE'
                                                ? 'Pro Code'
                                                : 'Agent Builder'}
                                        </div>
                                    </div>
                                </div>
                                <StyledOpenButton onClick={onAction}>
                                    <StyledFooterDiv>
                                        <ButtonName>Use Template</ButtonName>
                                    </StyledFooterDiv>
                                </StyledOpenButton>
                            </div>
                        </StyledCardActions>
                    </StyledFooter1Div>
                </Link>
            </StyledTileCard>
        </StyledMainDiv>
    );
};
