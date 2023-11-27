import { styled } from '@semoss/ui';
import { Env } from '@/env';
import { useApp } from '@/hooks';

const StyledIframe = styled('iframe')(() => ({
    flex: '1',
    height: '100%',
    width: '100%',
    border: 'none',
}));

/**
 * Render an app based on an id
 */
export const CustomAppRenderer = () => {
    const { appId } = useApp();

    // return the app
    return <StyledIframe src={`${Env.MODULE}/public_home/${appId}/portals/`} />;
};
