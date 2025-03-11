import { usePage } from '@inertiajs/react'
import { Menu, MenuHandler, MenuItem, MenuList } from '@material-tailwind/react'
import { EllipsisVerticalIcon } from 'lucide-react'
import React from 'react'

export default function CommentReplyOptions({ type, itemId }) {
    const handleDeleteFunc = () => {

    }
    return (
        <div>
            <div className="icon absolute right-0 top-2">
                <Menu>
                    <MenuHandler>
                        <EllipsisVerticalIcon size={20} color='gray' strokeWidth={1.5} className='cursor-pointer' />
                    </MenuHandler>
                    <MenuList>
                        <MenuItem>Edit</MenuItem>
                        <MenuItem
                            onClick={handleDeleteFunc}
                        >Delete</MenuItem>
                    </MenuList>
                </Menu>
            </div>
        </div>
    )
}
