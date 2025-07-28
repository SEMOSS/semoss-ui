import { observer } from 'mobx-react-lite';
import { ChatRoom } from '@/stores';
import { OptionsMenuComponent } from '@/components';

interface RoomControlsComponentProps {
    /** Room to render */
    room: ChatRoom;
}

export const RoomControlsComponent: React.FC<RoomControlsComponentProps> =
    observer((props) => {
        const { room } = props;

        return (
            <OptionsMenuComponent
                options={room.options}
                setOptions={(o) => {
                    room.setOptions(o);
                }}
                onClose={() => {
                    room.closeSidebar();
                }}
            />
        );
    });
