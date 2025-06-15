import { useContext, useRef, useState } from 'react'
import { BsTrash } from 'react-icons/bs'
import { FiRefreshCcw } from 'react-icons/fi'
import { createPortal } from 'react-dom'
import { ColorData, RectangleData } from '../store/rectangleStore'
import { RectangleContext } from '../context/RectangleContext'
import { observer } from 'mobx-react-lite'
import ColorMenu from './ColorMenu'
import { RectangleColors } from '../utils/colors';
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  Placement,
} from '@floating-ui/react';
import { useSocket } from '../SocketProvider'


type ShapeMenuProps = {
  selectedRect: RectangleData,
  updateColor: (color: ColorData) => void,
  handleDelete: () => void,
  closeMenu : () => void,
}

function RectangleMenu({ selectedRect, updateColor, handleDelete, closeMenu}: ShapeMenuProps) {
    const store = useContext(RectangleContext);
    const menuRef = useRef<HTMLDivElement|null>(null)
    const [open, setOpen] = useState<boolean>(false)
    const socket = useSocket();
    const { refs, floatingStyles, middlewareData } = useFloating({
      open,
      onOpenChange: setOpen,
      placement:"bottom",
      middleware: [offset(8), flip({fallbackPlacements: ['top', 'bottom-start', 'top-start'],}), shift()],
      whileElementsMounted: autoUpdate,
    });


    const deleteRectangle = () => {
        closeMenu()
        handleDelete()
    }


  const handleRotate = () => {
    const rotation = (selectedRect.rotation + 15) % 360;
    store.saveHistory({
        action: "rotate",
        id: selectedRect.id,
        previous: {id:selectedRect.id,rotation: selectedRect.rotation},
        current: {id:selectedRect.id,rotation: rotation}
    })
    store.rotateRectangle(selectedRect.id,rotation)
    socket?.emit("rectangle:rotate",{ id: selectedRect.id, rotation})
  }


  if (!selectedRect) return null

  return (
    createPortal(<div
        ref = {menuRef}
        id = "rectangle-menu-container"
        className={`bg-white rounded shadow-md z-50 flex items-center bg-white px-[14px] py-[8.5px] rounded-[25px] transition-all duration-200 ease-in-out animate-pulseGlowScale`}
        style={{
            position: 'fixed',
            right: "20px",
            bottom: "20px",
        }}
    >
        <button className = {`flex items-center justify-center w-[28px] h-[28px] border-box rounded-full cursor-pointer text-[17px] hover:bg-[#f7f7f7]`}
            onClick = {handleRotate}
        >
            <FiRefreshCcw/>
        </button>
        <button
          className = {`w-[22px] h-[22px] border-box rounded-full cursor-pointer mx-[13px] hover:scale-105 ${selectedRect?.fill === "White" ? "border-[1.35px] border-gray-300" : `${RectangleColors[selectedRect.fill]}`}`}
          ref={refs.setReference}
          onClick={() => setOpen(!open)}
        >
        </button>
        {open && <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="absolute z-50"
        >
          <ColorMenu updateColor = {(data)=>updateColor(data as ColorData)} closeMenu = {()=>setOpen(false)}/>
        </div>}
        <button className = {`flex items-center justify-center w-[28px] h-[28px] border-box rounded-full cursor-pointer text-[17px] hover:bg-[#fff1f1] hover:text-[#ff1e1e]`} onClick = {()=>deleteRectangle()}><BsTrash/></button>
    </div>,document.body)
  )
}

export default observer(RectangleMenu);
