import { GiPalette } from "react-icons/gi";
import { LiaUndoAltSolid } from "react-icons/lia";
import { LiaRedoAltSolid } from "react-icons/lia";
import {  BsPlus } from "react-icons/bs";
import { Stage, Layer} from 'react-konva';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import debounce from 'lodash.debounce';
import Konva from "konva";
import { ColorData, RectangleData, rectangleStore } from "../store/rectangleStore";
import { RectangleContext } from "../context/RectangleContext";
import { observer } from "mobx-react-lite";
import { FiMenu } from "react-icons/fi";
import { MdMenuOpen } from "react-icons/md";
import Rectangle from "./Rectangle";
import RectangleMenu from "./RectangleMenu";
import { useSocket } from "../SocketProvider";
import { reaction } from "mobx";
import { LuEraser } from "react-icons/lu";
import { useWindowSize } from "usehooks-ts";

export type DimensionsDataType = {
    width: number,
    height: number,
}
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const OFFSET = 40
const DEFAULT_WIDTH = 240
const DEFAULT_HEIGHT = 140

export const Dashboard = observer(() => {
    const store = useContext(RectangleContext);
    const [showNavigationMenu,setShowNavigationMenu] = useState<boolean>(false)
    const [selectedRectangle,setSelectedRectangle] = useState<string|null>(null)
    const stageContainer = useRef<HTMLDivElement|null>(null)
    const [containerSize, setContainerSize] = useState<DimensionsDataType>({ width: 0, height: 0 });
    const [isDragging,setIsDragging] = useState<string|null>(null)
    const [isResizing,setIsResizing] = useState<string|null>(null)
    const [scrolled,setScrolled] = useState<boolean>(false)
    const stageRef = useRef<Konva.Stage | null>(null)
    const navigationBtn = useRef<HTMLDivElement|null>(null)
    const navigationMenu = useRef<HTMLDivElement|null>(null)
    const socket = useSocket();
    const { width } = useWindowSize()
    const prevWidthRef =useRef(width)

    useEffect(() => {
      const prevWidth = prevWidthRef.current;
  
      if (prevWidth > 720 && width <= 720 && showNavigationMenu) {
        setShowNavigationMenu(false);
      }
  
      prevWidthRef.current = width;
    }, [width, showNavigationMenu]);

    const updateContainerSize = useMemo(
      () =>
        debounce(() => {
          if (stageContainer.current) {
            setContainerSize({
              width: stageContainer.current.offsetWidth,
              height: stageContainer.current.offsetHeight,
            });
          }
        }, 100),
      []
    );

    const scale = useMemo(() => {
        const scaleX = containerSize.width / CANVAS_WIDTH
        const scaleY = containerSize.height / CANVAS_HEIGHT
        const rawScale = Math.min(scaleX, scaleY);
        return rawScale
    }, [containerSize]);

  
    useEffect(() => {
      updateContainerSize()
      window.addEventListener('resize', updateContainerSize)
      return () => {
        window.removeEventListener('resize', updateContainerSize)
        updateContainerSize.cancel()
      };
    }, [updateContainerSize]);

    const deSelectRectangle = useCallback(() => {
        if (scrolled){
            const stage = stageRef.current
            if (!stage) return;
            const originalX = (containerSize.width - CANVAS_WIDTH * scale) / 2;
            const originalY = (containerSize.height - CANVAS_HEIGHT * scale) / 2;
            const layer = stage.findOne('Layer');
            if (!layer) return;
          
            layer.to({
              x: originalX,
              y: originalY,
              duration: 0.3,
              easing: Konva.Easings.EaseInOut,
            });
            setScrolled(false)
        }

        setSelectedRectangle(null)
    },[scrolled,containerSize,scale])

    const handleDelete = useCallback((rect_id: string) => {
        const rectangle = store.rectangles.find(rect => rect.id === rect_id)
        if (!rectangle) return
        store.deleteRectangle(rect_id)
        socket?.emit('rectangle:delete',rect_id)
        store.saveHistory({
            action: "delete",
            id: rectangle.id,
            previous: rectangle,
            current: undefined
        })
    },[socket,store])

   useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedRectangle) return
            if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault()
                handleDelete(selectedRectangle)
                deSelectRectangle()
            }
        }

        const handleClickOutside = (event: MouseEvent) => {
            const menuContainer = document.getElementById('rectangle-menu-container')
            const stageEl = stageRef.current?.container()
        
            const clickedInStage = stageEl?.contains(event.target as Node)
            const clickedInMenu = menuContainer?.contains(event.target as Node)

        
            if (!clickedInStage && !clickedInMenu) {
                if (navigationBtn.current && navigationBtn.current?.contains(event.target as Node)) return
                if (navigationMenu.current && navigationMenu.current?.contains(event.target as Node)) return
                deSelectRectangle()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener('mousedown', handleClickOutside)
        return () =>{
            window.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener('mousedown', handleClickOutside)
        }
    }, [selectedRectangle,store,deSelectRectangle,socket,handleDelete])

    useEffect(() => {
      const disposer = reaction(
        ()=> store.rectangles.map(rectangle => ({...rectangle})),
        (newRectangles : RectangleData[]) => {
            if (selectedRectangle && !newRectangles.find(r => r.id === selectedRectangle)) {
                deSelectRectangle()
            }
        }
      )

      return () => {
        disposer()
      }
    }, [store.rectangles,deSelectRectangle,selectedRectangle])

    const handleNavigationMenu = () => {
        setShowNavigationMenu(!showNavigationMenu)
        requestAnimationFrame(()=>{
            updateContainerSize()
            if (scrolled){
                deSelectRectangle()
            }
        })
    }

    const scrollToRect = (rect : RectangleData) => {
        const stage = stageRef.current;
        if (!stage) return;
      
        const containerCenterX = containerSize.width / 2;
        const containerCenterY = containerSize.height / 2;
      
        const newX = containerCenterX - rect.x * scale;
        const newY = containerCenterY - rect.y * scale;
      
        const layer = stage.findOne('Layer');
        if (!layer) return;
      
        layer.to({
          x: newX,
          y: newY,
          duration: 0.3,
          easing: Konva.Easings.EaseInOut,
        });
      

        requestAnimationFrame(()=>{
            setScrolled(true)
            setSelectedRectangle(rect.id)
        })
    }

    const handleAdd = () => {
        let new_offset = 0;
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const takenOffsets = new Set(store.rectangles.map(rect => rect.x - centerX))
        for (let i = 0; ; i++) {
            const offsetX = i * OFFSET;
            if (!takenOffsets.has(offsetX)) {
                new_offset = offsetX;
                break;
            }
        }
        const rectangle : RectangleData = {
            id : uuidv4(),
            x: centerX + new_offset,
            y: centerY + new_offset,
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            addedAtOffset: true,
            fill: "White",
            rotation: 0
        }
        store.addRectangle(rectangle)
        socket?.emit("rectangle:add", rectangle)
        store.saveHistory({action:"add",id:rectangle.id,previous:undefined,current:rectangle})

    }

    const handleMove = (id: string, e: Konva.Rect) => {
        const { x, y } = e.position()
        const rectangle = store.rectangles.find(rect => rect.id === id)
        if (rectangle){
            const previous_data = {id:id,x:rectangle.x,y:rectangle.y}
            store.moveRectangle(id,{x,y})
            socket?.emit("rectangle:move", { id: id, x, y });
            setIsDragging(null)
            store.saveHistory({
                action: "move",
                id: id,
                previous: previous_data,
                current: { id: id, x, y }
            })
            setSelectedRectangle(id)
        }
    }

    const handleResize = (id:string, data : {width: number, height: number, x: number, y: number}) => {
        const {width, height, x, y} = data
        const rectangle = store.rectangles.find(rect => rect.id === id)
        if (rectangle){
            const previous_data = {id:id,width:rectangle.width,height:rectangle.height,x:rectangle.x,y:rectangle.y}
            store.updateRectangle(id,data)
            socket?.emit("rectangle:resize", { id: id, width, height, x, y });
            requestAnimationFrame(() => {
                setIsResizing(null);
            });
            if (rectangle){
                store.saveHistory({
                    action:"resize",
                    id:id,
                    previous: previous_data,
                    current: {id:id,width:data.width,height:data.height,x:data.x,y:data.y}
                })
            }
        }
    }

    const handleColorChange = (id: string, color: ColorData) => {
        const rectangle = store.rectangles.find(rect => rect.id === id)
        if (rectangle){
            const previous_fill = rectangle.fill
            store.changeColor(id,color)
            socket?.emit("rectangle:changeColor", { id: selectedRectangle, fill: color })
            store.saveHistory({
                action: "changeColor",
                id: id,
                previous: {id:id,fill : previous_fill},
                current: {id:id,fill: color}
            })
        }
    }

    const handleClear = () => {
        rectangleStore.clear()
        socket?.emit('rectangle:clear')
    }


    return(
        <section className = "h-screen w-screen  flex flex-col overflow-hidden">
            <header className = {`flex items-center justify-between sticky top-[0px] left-[0px] w-full py-[12px] ${store.rectangles.length ? "pl-[15px] pr-[25px] max-sm:pl-[8px] max-sm:pr-[15px]" : "px-[25px] max-sm:px-[15px]"} bg-white border-box shadow-md border-box max-420:block`}>
                <div className = "flex items-center">
                    {store.rectangles.length > 0 && <div className = "w-[32px] h-[32px] mr-[12px] cursor-pointer flex items-center justify-center rounded-[8.5px] text-[22px] hover:bg-[#f7f7f7]" onClick = {()=>handleNavigationMenu()}  ref = {navigationBtn}>{!showNavigationMenu ? <FiMenu/> : <MdMenuOpen/>}</div>}
                    <h1 className="font-outfit font-extrabold text-[26px] max-sm:text-[22px]">My Canvas</h1>
                    <div className = "ml-[14px] text-[30px] text-[#ff1e1e] max-sm:text-[28px] max-sm:ml-[10px]"><GiPalette/></div>
                </div>
                <div className = {`flex items-center max-420:justify-end max-420:mt-[5px] ${showNavigationMenu && "max-720:hidden"}`}>
                    <button type = "button" className = "w-[32px] h-[32px] rounded-[8.5px] flex items-center justify-center border-box border-[1.3px] hover:bg-[#f1f1f1] hover:border-transparent text-[#969696] cursor-pointer mr-[15px]  outline-none" onClick = {()=>handleClear()}><LuEraser/></button>{store.history.length===0} 
                    <button type = "button" className = "w-[32px] h-[32px] rounded-[8.5px] flex items-center justify-center bg-[#f1f1f1] hover:bg-[#e6e6e6] hover:text-[#6c6c6c] text-[#969696] cursor-pointer mr-[10px] disabled:pointer-events-none disabled:opacity-70 outline-none" disabled = {store.history.length===0} onClick = {()=>store.undo()}><LiaUndoAltSolid/></button>
                    <button type = "button" className = "w-[32px] h-[32px] rounded-[8.5px] flex items-center justify-center bg-[#f1f1f1] hover:bg-[#e6e6e6] hover:text-[#6c6c6c] text-[#969696] cursor-pointer disabled:pointer-events-none disabled:opacity-70 outline-none" disabled = {store.future.length===0} onClick = {()=>store.redo()}><LiaRedoAltSolid/></button>
                    <div className  = "w-[1.3px] h-[32px] bg-zinc-200 mx-[20px] max-sm:mx-[12px]"></div>
                    <div className = "flex items-center py-[7px] px-[10px] rounded-[5px] bg-[#ff1e1e] cursor-pointer hover:bg-[#ef0000] max-sm:px-[0px] max-sm:py-[0px] max-sm:w-[32px] max-sm:min-w-[32px] max-sm:h-[32px] max-sm:rounded-full max-sm:flex max-sm:items-center max-sm:justify-center" onClick = {()=>handleAdd()}>
                        <div className = "w-[19px] h-[19px] bg-white rounded-full flex items-center justify-center text-[#ff4d4d] max-sm:w-[21px] max-sm:h-[21px] max-sm:text-[18px]"><BsPlus/></div>
                        <span className = "text-[13.5px] font-poppins ml-[4.5px] text-white max-sm:hidden">Rectangle</span>
                    </div>
                </div> 
            </header>
            <main
                className = "flex w-full grow overflow-hidden"
            >
                {(showNavigationMenu && store.rectangles.length > 0) && <section className = "w-[200px] h-full overflow-y-auto max-720:fixed max-720:w-screen max-720:top-[57px] max-720:left-0 max-720:bg-white max-720:z-50 max-720:border-t-[1.85px]" style={{ height: "calc(100vh - 57px)" }} ref = {navigationMenu}>
                    {store.rectangles.map((rectangle,index)=>(
                        <div key = {index} className = {`px-[10px] py-[6.5px] w-full border-box ${index+1 !== store.rectangles.length && "border-b-[1.3px]"}`}>
                            <button className = {`text-left font-lexend px-[6px] py-[6.5px] font-light text-[14.2px] w-full border-box rounded-[8px] hover:bg-[#fff1f1] hover:text-[#ff1e1e] hover:font-bold ${selectedRectangle === rectangle.id && "bg-[#fff1f1] text-[#ff1e1e] font-normal"}`} onClick = {()=>scrollToRect(rectangle)}>Rectangle {index+1}</button>
                        </div>
                    ))}
                </section>}
                <section
                    className = "w-full grow overflow-hidden h-full flex justify-center items-center"
                    style={{
                        background: "linear-gradient(to bottom, #fff5f5, #ffecec, #fbbbbb)"
                    }}                    
                >
                    <div
                        className="w-[85%] max-h-[95%] max-w-calc-95-4/3 overflow-y-hidden"
                    > 
                        <div
                            className = "aspect-[4/3] w-full h-auto bg-white shadow-md rounded-[5px] overflow-hidden"
                            style={{
                                backgroundImage: `
                                    linear-gradient(to right, #ffbdbd 1px, transparent 1px),
                                    linear-gradient(to bottom, #ffbdbd 1px, transparent 1px)
                                `,
                                backgroundSize: '20px 20px',
                                backgroundColor: '#fffbfb',
                            }}
                            ref = {stageContainer}
                        >
                            <Stage
                                width={containerSize.width}
                                height={containerSize.height}
                                ref = {stageRef}
                                onMouseDown={(e) => {
                                    if (e.target === e.target.getStage()) {
                                    deSelectRectangle();
                                    }
                                }}
                            >
                                <Layer
                                    scaleX={scale}
                                    scaleY={scale}
                                    x={(containerSize.width - CANVAS_WIDTH * scale) / 2}
                                    y={(containerSize.height - CANVAS_HEIGHT * scale) / 2}
                                >
                                    {store.rectangles.map((rect) => {
                                        if (!rect) return null
                                        const renderX = Math.max(rect.x, 10);
                                        const renderY = Math.max(rect.y, 10);
                                        return (
                                            <Rectangle
                                                key = {rect.id}
                                                rect = {{...rect,x:renderX,y:renderY}}
                                                isSelected = {selectedRectangle === rect.id}
                                                onSelect = {()=>setSelectedRectangle(rect.id)}
                                                resizeRectangle={(data)=>handleResize(rect.id,data)}
                                                startDrag={()=>setIsDragging(rect.id)}
                                                startResize={()=>setIsResizing(rect.id)}
                                                handleMove = {(e)=>handleMove(rect.id,e)}
                                            />
                                        )
                                    })}
                                </Layer>
                            </Stage>
                        </div>
                    </div>

                </section>
            </main>
            {(selectedRectangle !== null && isDragging !== selectedRectangle && isResizing !== selectedRectangle) &&
                <RectangleMenu
                    selectedRect = {store.rectangles.find(rect => rect.id === selectedRectangle) as RectangleData}
                    closeMenu = {()=>deSelectRectangle()}
                    updateColor = {(color)=>handleColorChange(selectedRectangle,color)}
                    handleDelete={()=>handleDelete(selectedRectangle)}
                />
            }
        </section>
    )
})