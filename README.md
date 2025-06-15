# A full-stack web application with:

⚛️ React (frontend)

🚀 Node.js + Express (backend)

## 📋 What the App Does
### 📋 Frontend Implementation

- Initialize a Konva Stage component to serve as the canvas.

- Implement an **"Add Rectangle"** button that:
  - Creates a new rectangle on the canvas each time it is clicked.
  - Broadcasts the rectangle creation event via Socket.io to other connected clients.

- Implement **Undo**, **Redo**, and **Clear** buttons:
  - **Undo:** Reverts the last action by using a history stack.
  - **Redo:** Re-applies the last undone action using a redo stack.
  - **Clear:** Removes all rectangles from the canvas.
  - All changes are broadcasted to connected clients through the backend to keep everyone in sync.

- Configure rectangles to be draggable using Konva’s `draggable` prop.

- Implement the `onDragMove` callback to emit position updates for live syncing.

- Add a **rectangle menu** that appears when a rectangle is selected, which includes:
  - **Color menu:** Change the rectangle’s fill color.  
  - **Rotate button:** Rotate the selected rectangle.  
  - **Delete button:** Delete the selected rectangle.  

  > **Note:** Changes to color, rotation, and deletion are also broadcasted to all connected clients to keep canvases synchronized.

- Support deletion of the selected rectangle by clicking the Delete button or pressing the Backspace key.

- Include a navigation bar that allows users to scroll to rectangles that are outside the visible canvas area.
  
- Implement a **fallback mechanism** that uses `localStorage` to sync changes between tabs in case the Socket.io connection fails, ensuring seamless offline or connection-lost experience.

### Backend Implementation
- Set up a Socket.io server to manage multiple client connections.

- Handle the following socket events:

- **rectangle:add**  
  - **Broadcasts:** A new rectangle has been added to the canvas.  
  - **Params:**  
    - `rect: Rectangle` — full rectangle object with properties like `id`, `x`, `y`, `width`, `height`, `fill`, `rotation`.  
  - **Purpose:** Notify all clients to add this new rectangle.

- **rectangle:move**  
  - **Broadcasts:** A rectangle’s position has changed (drag/move).  
  - **Params:**  
    - `rectUpdate: { id: string; x: number; y: number }` — rectangle ID and new coordinates.  
  - **Purpose:** Update position on all clients.

- **rectangle:changeColor**  
  - **Broadcasts:** A rectangle’s fill color has changed.  
  - **Params:**  
    - `rectUpdate: { id: string; fill: string }` — rectangle ID and new fill color.  
  - **Purpose:** Sync color changes across clients.

- **rectangle:resize**  
  - **Broadcasts:** A rectangle has been resized (and possibly repositioned).  
  - **Params:**  
    - `rectUpdate: { id: string; width: number; height: number; x: number; y: number }` — rectangle ID, new size, and position.  
  - **Purpose:** Keep size and position consistent.

- **rectangle:rotate**  
  - **Broadcasts:** A rectangle has been rotated.  
  - **Params:**  
    - `rectUpdate: { id: string; rotation: number }` — rectangle ID and new rotation angle.  
  - **Purpose:** Sync rotation changes.

- **rectangle:delete**  
  - **Broadcasts:** A rectangle has been deleted.  
  - **Params:**  
    - `id: string` — ID of the rectangle to delete.  
  - **Purpose:** Remove rectangle from canvases.

- **rectangle:clear**  
  - **Broadcasts:** All rectangles have been cleared from the canvas.  
  - **Params:** None.  
  - **Purpose:** Clear entire canvas on all clients.


## 🗂 Folder Structure

applied-impact-robotics-assessment/

├── backend/       # Node.js + Express backend

├── frontend/      # React frontend

├── README.md



## 🚀 Getting Started

✅ Prerequisites
- Node.js (>=16.x)
- npm or yarn
- Git



## 📥 Installation
1. Clone the repo
- git clone https://github.com/jamila-esther/applied-impact-robotics-assessment.git
- cd applied-impact-robotics-assessment

2. Install backend dependencies
- cd backend
- npm install

3. Install frontend dependencies
- cd ../frontend
- npm install


## 🧪 Running the App

▶️ Start the backend
- cd backend

- npm run dev

- Backend runs at: http://localhost:4000


💻 Start the frontend
- cd frontend
  
- npm start
  
- Frontend runs at: http://localhost:3000
