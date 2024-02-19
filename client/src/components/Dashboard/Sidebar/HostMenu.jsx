import { BsFillHouseAddFill } from "react-icons/bs";
import MenuItem from "./Menuitem";
import { MdOutlineManageHistory } from "react-icons/md";

const HostMenu = () => {
    return (
        <>
            <MenuItem
                icon={BsFillHouseAddFill}
                label='Add Room'
                address='add-room'
            />
            <MenuItem
                icon={MdOutlineManageHistory}
                label='My Listings'
                address='my-listings'
            />
        </>
    );
};

export default HostMenu;