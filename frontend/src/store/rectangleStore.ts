import { makeAutoObservable, toJS } from "mobx";
import { socket } from "../SocketProvider";


export type ColorData = 'White' | 'Orange' | 'Red' |'Rose' | 'Green' | 'Fuchsia' | 'Red-Orange' | 'Warm Yellow'

export interface RectangleData {
    id : string,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: ColorData ,
    rotation: number,
    addedAtOffset: boolean
}

interface History{
    action: 'add' | 'delete' | 'move' | 'resize' | 'changeColor' | 'rotate',
    id: string,
    previous?: Partial<RectangleData>,
    current?: Partial<RectangleData>
}


class RectangleStore{
    rectangles: RectangleData[] = JSON.parse(localStorage.getItem("rectangles") as string) as RectangleData[] ?? []
    history: History[] = []
    future: History[] = []

    constructor(){
        makeAutoObservable(this)
    }

    saveHistory(historyEntry: History) {
        this.history.push(historyEntry);
        this.future = [];
    }

    setRectangles(rects: RectangleData[]) {
        this.rectangles = rects;
    }

    addRectangle(rectangle: RectangleData){
        const exists = this.rectangles.some(rect => rect.id === rectangle.id);
        if (!exists) {
            this.rectangles.push(rectangle)
        }
    }

    updateRectangle(id: string, data: Partial<RectangleData>){
        this.rectangles = this.rectangles.map((rectangle)=>{
            if (rectangle.id === id){
                return {...rectangle,...data}
            }
            else{
                return rectangle
            }
        })
    }

    changeColor(id:string,color: ColorData){
        const rectangle = this.rectangles.find((rectangle) => rectangle.id === id);
        if (rectangle) {
          rectangle.fill = color;
        }
    }

    moveRectangle(id: string,update: {x:number,y:number}){
        const rectangle = this.rectangles.find((rectangle) => rectangle.id === id);
        if (rectangle) {
            rectangle.x = update.x;
            rectangle.y = update.y;
            rectangle.addedAtOffset = false;
        }
    }

    deleteRectangle(id: string){
        const rectangle = this.rectangles.find((rectangle) => rectangle.id === id);
        if (rectangle){
            this.rectangles = this.rectangles.filter(rectangle => rectangle.id !== id)
        }
    }

    rotateRectangle(id: string, rotation: number){
        const rectangle = this.rectangles.find(rectangle => rectangle.id === id);
        if (rectangle) {
          rectangle.rotation = rotation
        }
    }

    undo() {
        if (this.history.length === 0) return;
        const previous = this.history.pop();
        if (previous){
            this.future.push(previous)
            this.reverseAction(previous)
        }
    }

    clear(){
        this.history = []
        this.future = []
        this.rectangles = []
    }

    reverseAction(historyEntry: History){
        const { action, previous, id} = historyEntry
        const rectangle = this.rectangles.find((rectangle) => rectangle.id === id);
        switch(action){
            case 'add':
                if (!rectangle) return
                this.deleteRectangle(id)
                socket.emit('rectangle:delete',id)
                return
            case 'delete':
                this.addRectangle(previous as RectangleData)
                socket.emit('rectangle:add',previous)
                return
            case 'move':
                if (!rectangle) return
                this.moveRectangle(id,{x:previous?.x as number,y:previous?.y as number})
                socket.emit('rectangle:move',previous)
                return
            case 'resize':
                if (!rectangle) return
                this.updateRectangle(id,previous as Partial<RectangleData>)
                socket.emit('rectangle:resize',previous)
                return
            case 'changeColor':
                if (!rectangle) return
                this.changeColor(id,previous?.fill as ColorData)
                socket.emit('rectangle:changeColor',previous)
                return
            case 'rotate':
                if (!rectangle) return
                this.rotateRectangle(id,previous?.rotation as number)
                socket.emit('rectangle:rotate',previous)
                return
            default:
                return

        }
    }

    applyAction(historyEntry: History){
        const { action, current, id} = historyEntry
        const rectangle = this.rectangles.find((rectangle) => rectangle.id === id);
        switch(action){
            case 'add':
                this.addRectangle(current as RectangleData)
                socket.emit('rectangle:add',current)
                return
            case 'delete':
                if (!rectangle) return
                this.deleteRectangle(id)
                socket.emit('rectangle:delete',id)
                return
            case 'move':
                if (!rectangle) return
                this.moveRectangle(id,{x:current?.x as number,y:current?.y as number})
                socket.emit('rectangle:move',current)
                return
            case 'resize':
                if (!rectangle) return
                this.updateRectangle(id,current as Partial<RectangleData>)
                socket.emit('rectangle:resize',current)
                return
            case 'changeColor':
                if (!rectangle) return
                this.changeColor(id,current?.fill as ColorData)
                socket.emit('rectangle:changeColor',current)
                return
            case 'rotate':
                if (!rectangle) return
                this.rotateRectangle(id,current?.rotation as number)
                socket.emit('rectangle:rotate',current)
                return
            default:
                return
        }
    }
      
      redo() {
        if (this.future.length === 0) return;
        const next = this.future.pop();
        if (next){
            this.history.push(next);
            this.applyAction(next)
        }
      }
}

export const rectangleStore = new RectangleStore()