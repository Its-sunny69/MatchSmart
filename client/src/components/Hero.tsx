import { useEffect, useRef } from "react"
import { getSocket } from "../utils/socket";

export default function Hero() {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const socket = getSocket()
        socket.on('connect', () => {
            console.log('Connected to the server');
        });
    }, [])

    const startCamera = async () => {
        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 },
                },
                audio: true,
            };
            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                    }
                })
                .catch(err => console.error('Error accessing webcam:', err));
        } catch (error) {
            console.error("Error accessing the webcam:", error);
        }
    };
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const tracks = stream.getTracks();
            tracks.forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    return (
        <div className='w-full h-full min-h-[500px] bg-gray-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
            <div className='w-full h-[300px] bg-red-600'>
                <div className='w-full md:w-4/5 h-full'>
                    <video className="w-full h-full border-2" ref={videoRef}>

                    </video>
                </div>
            </div>
            <div className='w-full h-[300px] bg-blue-600'></div>
            <div className='w-full h-[200px] flex justify-center items-start p-2'>
                <button type="button" className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900" onClick={startCamera}>
                    Start
                </button>
                <button type="button" className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900" onClick={stopCamera}>
                    Stop
                </button>
            </div>

        </div >
    )
}