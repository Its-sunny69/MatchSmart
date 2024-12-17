import React from 'react'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from './ui/button';
import { Separator } from '@radix-ui/react-dropdown-menu';
interface PopupModalProps {
    setPreference: Function,
    isOpen: boolean,
    setIsOpen: Function,
    setIsOpened: Function,
    isOpened: boolean,
}

const PopupModal: React.FC<PopupModalProps> = ({ setPreference, isOpen, setIsOpen, isOpened, setIsOpened }) => {
    if (!isOpened)
        return (
            <AlertDialog open={isOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader className='flex flex-col w-full'>
                        <AlertDialogTitle className='text-xl'>Wanna Connect with someone?</AlertDialogTitle>
                        <Separator />
                        <AlertDialogDescription>
                            Just click your preference below to start your search.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                setPreference('male');
                                setIsOpened(true);
                            }}
                            className="text-white bg-blue-700 hover:bg-blue-900 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                        >
                            Male
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                setPreference('female');
                                setIsOpened(true);
                            }}
                            className="text-white bg-fuchsia-700 hover:bg-fuchsia-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-fuchsia-400 dark:hover:bg-fuchsia-500 dark:focus:ring-gray-700 dark:border-gray-700"
                        >
                            Female
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog >
        )
}

export default PopupModal;