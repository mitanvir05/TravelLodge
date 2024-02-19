import { BsFingerprint } from "react-icons/bs";
import MenuItem from "./Menuitem";

const GuestMenu = () => {
    return (
        <>
            <MenuItem
                icon={BsFingerprint}
                label='My Bookings'
                address='my-bookings'
            />
        </>
    );
};

export default GuestMenu;