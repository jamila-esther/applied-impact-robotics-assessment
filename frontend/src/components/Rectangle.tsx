import React, { useEffect, useRef } from 'react'
import { RectangleData } from '../store/rectangleStore';
import { RectangleHexColors } from '../utils/colors';
import { Rect, Transformer } from 'react-konva';
import Konva from 'konva';

type RectangleProps = {
    rect: RectangleData,
    onSelect: () => void,
    isSelected: boolean,
    resizeRectangle: (data: {width: number, height: number, x: number, y: number}) => void,
    handleMove: (e: Konva.Rect) => void,
    startDrag: () => void,
    startResize: () =>void,
}
const Rectangle = ({rect,isSelected,onSelect,resizeRectangle,handleMove,startDrag,startResize}: RectangleProps) => {
    const transformerRef = useRef<any>(null);
    const shapeRef = useRef<any>(null);

    useEffect(() => {
      if (transformerRef.current && shapeRef.current && isSelected) {
        transformerRef.current.nodes([shapeRef.current]);
        transformerRef.current.rotateEnabled(false)
        transformerRef.current.getLayer().batchDraw();
        setTimeout(() => {
            transformerRef.current?.getLayer().batchDraw();
        }, 0);
      }
    }, [rect, isSelected]);
  

    const handleTransformEnd = (node: Konva.Rect) => {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        const newWidth = node.width() * scaleX;
        const newHeight = node.height() * scaleY;
        

        node.scaleX(1);
        node.scaleY(1);
        resizeRectangle({
            width: newWidth,
            height: newHeight,
            x: node.x(),
            y: node.y(),
        })
    }
  return (
    <>
        <Rect
            id={rect.id}
            key={rect.id}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            offsetX={rect.width/2}
            offsetY={rect.height/2} 
            rotation={rect.rotation}
            fill={RectangleHexColors[rect.fill]}
            stroke={rect.fill === 'White' ? '#ff6b6b' : 'transparent'}
            strokeWidth={1.5}
            cornerRadius={(Math.min(rect.width, rect.height) * 0.04)}
            ref={shapeRef}
            draggable
            onTransformStart={()=>startResize()}
            onTransformEnd={(e) => handleTransformEnd(e.target as Konva.Rect)}
            onDragStart={() => startDrag()}
            onDragEnd={(e)=>{
                handleMove(e.target as Konva.Rect)
            }}
            onClick = {onSelect}
            onTap = {onSelect}
            rotateEnabled = {false}

        />
        {isSelected && <Transformer ref={transformerRef} />}
    </>
  )
}

export default Rectangle