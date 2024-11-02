import React from 'react'

export default function Navbar() {
    return (
        <div className='mb-auto w-full h-fit py-2 text-gray-500 flex justify-center items-center'>
            <div className='flex w-1/2'>
                <a href="https://flowbite.com/" className="flex justify-start items-center space-x-3 rtl:space-x-reverse ml-2">
                    <img src="https://flowbite.com/docs/images/logo.svg" className="h-8" alt="Flowbite Logo" />
                    <span className="self-center text-lg md:text-2xl font-semibold whitespace-nowrap dark:text-white">MatchSmart</span>
                </a>
            </div>
            <div className='flex justify-end gap-x-2 items-center h-full w-1/2'>
                <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Signup</button>
                <button type="button" className="text-white bg-gray-500 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-500 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">Login</button>                
            </div>
        </div>
    )
}
