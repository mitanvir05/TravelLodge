import MenuItem from "../Sidebar/Menuitem";
import { FaUserCog } from 'react-icons/fa'
const AdminMenu = () => {
    return (
        <div>
            <>
                <MenuItem
                    icon={FaUserCog}
                    label='Manage Users'
                    address='manage-users'
                />
            </>
        </div>
    );
};

export default AdminMenu;