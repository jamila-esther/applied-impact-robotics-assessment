import React from 'react';
import { RectangleColors } from '../utils/colors';
import { observer } from 'mobx-react-lite';
import { ColorData } from '../store/rectangleStore';

type ColorMenuProps = {
  updateColor: (color: ColorData) => void,
  closeMenu: () => void
}
function ColorMenu({updateColor, closeMenu }: ColorMenuProps) {
    const updateRectangle = (color: ColorData) => {
        updateColor(color)
        closeMenu()
    }

  return (
    <div className="p-2 bg-white rounded-[10px] shadow-md flex flex-wrap justify-between w-[140px]">
      {Object.keys(RectangleColors).map((color,index) => (
        <button
          key = {index}
          className={`w-[23px] h-[23px] rounded-full cursor-pointer border-2 ${color === "White" ? "border-grey-900" : "border-transparent"} hover:border-gray-500 ${index + 1 % 4 !== 0 && "mr-[6px]"} ${index +1 > 4 && "mt-[8px]"} ${RectangleColors[color as ColorData]}`}
          onClick={() => updateRectangle(color as ColorData)}
        />
      ))}
    </div>
  );
}

export default observer(ColorMenu);
