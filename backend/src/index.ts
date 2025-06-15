import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

interface Rectangle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string,
  rotation: number
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const rectangles: Rectangle[] = [];

io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        io.emit('rectangle:init', rectangles);

        socket.on('rectangle:init', (rects: Rectangle[]) => {
            for (let i = 0; i < rects.length; i++){
                const rectangle = rects[i]
                const exists = rectangles.some(r => r?.id === rectangle.id);
                if (!exists) {
                    rectangles.push(rectangle);
                    io.emit('rectangle:add', rectangle)
                }; 
            }
        })

        socket.on('rectangle:add', (rect: Rectangle) => {
            const exists = rectangles.some(r => r.id === rect.id);
            if (!exists) {
                rectangles.push(rect);
                io.emit('rectangle:add', rect)
            }; 
        })

        socket.on('rectangle:move', (rectUpdate: { id: string; x: number; y: number }) => {
            const index = rectangles.findIndex(r => r.id === rectUpdate.id);

            if (index !== -1) {
                rectangles[index].x = rectUpdate.x;
                rectangles[index].y = rectUpdate.y;
                io.emit('rectangle:move', rectUpdate);
            } else {
                socket.emit('error', {
                    message: `Attempting to move a rectangle that no longer exists.`,
                    id: rectUpdate.id,
                    code: 'RECTANGLE_NOT_FOUND'
                });
            }
        })

        socket.on('rectangle:changeColor', (rectUpdate: { id: string; fill: string }) => {
            const index = rectangles.findIndex(r => r.id === rectUpdate.id);

            if (index !== -1) {
                rectangles[index].fill = rectUpdate.fill;
                io.emit('rectangle:changeColor', rectUpdate);
            }
            else {
                socket.emit('error', {
                    message: `Attempting to update a rectangle that no longer exists.`,
                    id: rectUpdate.id,
                    code: 'RECTANGLE_NOT_FOUND'
                });
            }
        })

        socket.on('rectangle:resize', (rectUpdate: { id: string; width: number, height: number, x: number, y: number }) => {
            const index = rectangles.findIndex(r => r.id === rectUpdate.id);

            if (index !== -1) {
                rectangles[index].width = rectUpdate.width;
                rectangles[index].height = rectUpdate.height;
                rectangles[index].x = rectUpdate.x;
                rectangles[index].y = rectUpdate.y;
                io.emit('rectangle:resize', rectUpdate);
            }
            else {
                socket.emit('error', {
                    message: `Attempting to resize a rectangle that no longer exists.`,
                    id: rectUpdate.id,
                    code: 'RECTANGLE_NOT_FOUND'
                });
            }
        })

        socket.on('rectangle:rotate', (rectUpdate: { id: string; rotation: number }) => {
            const index = rectangles.findIndex(r => r.id === rectUpdate.id);

            if (index !== -1) {
                rectangles[index].rotation = rectUpdate.rotation
                io.emit('rectangle:rotate', rectUpdate);
            }
            else {
                socket.emit('error', {
                    message: `Attempting to resize a rectangle that no longer exists.`,
                    id: rectUpdate.id,
                    code: 'RECTANGLE_NOT_FOUND'
                });
            }
        })
        socket.on('rectangle:delete', (id: string) => {
            const index = rectangles.findIndex(r => r.id === id);

            if (index !== -1) {
                rectangles.splice(index, 1);
                io.emit('rectangle:delete', id);
            }
            else {
                socket.emit('error', {
                    message: `Attempting to delete a rectangle that no longer exists.`,
                    id: id,
                    code: 'RECTANGLE_NOT_FOUND'
                });
            }
        })

        socket.on('rectangle:clear',() => {
            rectangles.length = 0
            io.emit('rectangle:clear');
        })

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});