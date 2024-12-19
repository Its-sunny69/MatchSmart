import { Socket } from "socket.io-client";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { useEffect, useRef } from "react";
import { getSocket } from "@/utils/socket";

interface NavbarProps {
  isOpened: boolean,
  preference: string,
  setPreference: Function,
  waiting: boolean
}

const Navbar: React.FC<NavbarProps> = ({ isOpened, preference, setPreference, waiting }) => {
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    socket.current = getSocket();
  }, []);

  const handleClick = (gender: string) => {
    setPreference(gender);
    socket.current?.emit('setPreference', gender)
    if (waiting) {
      socket.current?.emit('join')
    }
  }

  return (
    <div className="w-full h-fit py-2 md:px-3 pr-5 text-gray-500 flex justify-center items-center select-none border-b-2 mb-5">
      <div className="flex w-full justify-start">
        <a
          href="https://flowbite.com/"
          className="flex justify-start items-center space-x-3 rtl:space-x-reverse ml-2"
        >
          <img
            src="https://flowbite.com/docs/images/logo.svg"
            className="h-8"
            alt="Flowbite Logo"
          />
          <span className="self-center text-lg md:text-2xl font-semibold whitespace-nowrap dark:text-white">
            MatchSmart
          </span>
        </a>
      </div>
      <div className="flex justify-end items-center w-full">
        <ModeToggle />
        {
          isOpened &&
          (
            <div className="flex justify-end gap-x-4 items-center h-full w-full px-3 py-1">
              <Button
                type="button"
                className={`text-white bg-blue-700 hover:bg-blue-800 ${preference == 'male' && 'outline outline-1 outline-offset-4 outline-blue-600'} focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800`}
                onClick={() => handleClick('male')}
              >
                Male
              </Button>
              <Button
                type="button"
                className={`text-white bg-fuchsia-400 hover:bg-gray-900 ${preference == 'female' && 'outline outline-1 outline-offset-4 outline-fuchsia-400'} font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-fuchsia-400 dark:hover:bg-fuchsia-500 dark:focus:ring-gray-700 dark:border-gray-700 `}
                onClick={() => handleClick('female')}
              >
                Female
              </Button>
            </div>
          )
        }
      </div>
    </div>
  );
}

export default Navbar;