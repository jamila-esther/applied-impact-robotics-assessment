import { RectangleData } from "../store/rectangleStore";

const DEFAULT_WIDTH = 300
const DEFAULT_HEIGHT = 200

export const isOverlapping = (x: number, y: number, rectangles: RectangleData[])  => {
    const left = x - DEFAULT_WIDTH / 2;
    const right = x + DEFAULT_WIDTH / 2;
    const top = y - DEFAULT_HEIGHT / 2;
    const bottom = y + DEFAULT_HEIGHT / 2;
  
    return rectangles.some(rectangle => {
      const shapeLeftCoords = rectangle.x - rectangle.width / 2;
      const shapeRightCoords = rectangle.x + rectangle.width / 2;
      const shapeTopCoords = rectangle.y - rectangle.height / 2;
      const shapeBottomCoords = rectangle.y + rectangle.height / 2;
  
      return left < shapeRightCoords && right > shapeLeftCoords && top < shapeBottomCoords && bottom > shapeTopCoords;
    });
  }