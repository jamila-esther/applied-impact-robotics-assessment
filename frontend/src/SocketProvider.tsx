import React, { createContext, ReactNode, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { observer } from "mobx-react-lite";
import { ColorData, RectangleData, rectangleStore } from "./store/rectangleStore";
import { toast } from "react-toastify";
const SocketContext = createContext<Socket | null>(null);


export const socket = io("http://localhost:4000",{
        reconnection: true,
        reconnectionAttempts: 10,
        timeout: 5000
    }
)

type SocketError = {
    message: string;
    id?: string,
    code?: string;
};

interface SocketProviderProps {
    children: ReactNode;
  }
  
const SocketProvider = observer(({ children }: SocketProviderProps) => {
    const connectedRef = useRef<boolean>(false)

  useEffect(() => {
    socket?.connect()
    if (!connectedRef.current){
        socket.on("connect", () => {
            console.log("Connected to socket server")
            let rectangles = JSON.parse(localStorage.getItem("rectangles") as string) ?? []
            if (rectangles.length){
              socket.emit('rectangle:init',rectangles as RectangleData[])
            }
          })
        
        socket.io.on("reconnect_failed", () => {
            console.log("Reconnect failed");
            toast.error(
                <span className={`font-poppins text-[13.5px] text-black`}>
                    Unable to connect to websocket!
                </span>,
                {
                    position: "top-center"
                }
            ) 
        })

        connectedRef.current = true
    }

    socket.on("rectangle:init", (rects: RectangleData[]) => {
        rectangleStore.setRectangles(rects)
    });

    socket.on("rectangle:add", (rect: RectangleData) => {
        const rectangle = rectangleStore.rectangles.find(r => r.id === rect.id);
        if (!rectangle) rectangleStore.addRectangle(rect);
    });

    socket.on("rectangle:move", (rectUpdate: { id: string; x: number; y: number }) => {
        const rect = rectangleStore.rectangles.find(r => r.id === rectUpdate.id);
  
        if (rect) {
          rectangleStore.moveRectangle(rectUpdate.id,{x: rectUpdate.x,y:rectUpdate.y})
        }
        else {
            toast.error(
                <span className={`font-poppins text-[13.5px] text-black`}>
                    Attempting to move a rectangle that no longer exists.
                </span>,
                {
                    position: "top-center"
                }
            )        
        }
    });

    socket.on("rectangle:delete", (id: string) => {
        const rect = rectangleStore.rectangles.find(r => r.id === id);
        if (rect) {
            rectangleStore.deleteRectangle(id)
        }
    });

    socket.on("rectangle:clear",()=>{
        rectangleStore.clear()
    })

    socket.on("rectangle:changeColor", (rectUpdate: { id: string; fill: ColorData }) => {
        const rect = rectangleStore.rectangles.find(r => r.id === rectUpdate.id);
  
        if (rect) {
            rectangleStore.changeColor(rectUpdate.id,rectUpdate.fill)
        }
        else {
            toast.error(
                <span className={`font-poppins text-[13.5px] text-black`}>
                    Attempting to update a rectangle that no longer exists.
                </span>,
                {
                    position: "top-center"
                }
            ) 
        }
    });

    socket.on('rectangle:resize', (rectUpdate: { id: string; width: number, height: number, x: number, y: number }) => {
        const rect = rectangleStore.rectangles.find(r => r.id === rectUpdate.id);

        if (rect) {
            rectangleStore.updateRectangle(rectUpdate.id,{
                width: rectUpdate.width,
                height: rectUpdate.height,
                x: rectUpdate.x,
                y: rectUpdate.y
            })
        }
        else {
            toast.error(
                <span className={`font-poppins text-[13.5px] text-black`}>
                    Attempting to resize a rectangle that no longer exists.
                </span>,
                {
                    position: "top-center"
                }
            ) 
        }
    })

    socket.on('rectangle:rotate', (rectUpdate: { id: string; rotation: number }) => {
        const rect = rectangleStore.rectangles.find(r => r.id === rectUpdate.id);

        if (rect) {
            rectangleStore.rotateRectangle(rectUpdate.id,rectUpdate.rotation)
        }
        else {
            toast.error(
                <span className={`font-poppins text-[13.5px] text-black`}>
                    Attempting to rotate a rectangle that no longer exists.
                </span>,
                {
                    position: "top-center"
                }
            ) 
        }
    })


    socket.on("error", (error: SocketError) => {
        const { id, code, message} = error
      console.error("Socket error:", error);
      if (code === 'RECTANGLE_NOT_FOUND'){
        toast.error(
            <span className={`font-poppins text-[13.5px] text-black`}>
                {message}
            </span>,
            {
                position: "top-center"
            }
        ) 
        rectangleStore.deleteRectangle(id as string)
      }
      else{
        toast.error(
            <span className={`font-poppins text-[13.5px] text-black`}>
                Something unexpected occured!
            </span>,
            {
                position: "top-center"
            }
        ) 
      }
    });

    socket.on("disconnect", () => {
        console.log("Disonnected from socket server");
      });

    return () => {
        socket.off("rectangle:add");
        socket.off("rectangle:move");
        socket.off("rectangle:delete");
        socket.off("rectangle:changeColor");
        socket.off("rectangle:resize");
        socket.off("rectangle:rotate");
        socket.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
});

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context) return context;
  };

export default SocketProvider;