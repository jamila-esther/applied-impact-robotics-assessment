import React, { useContext, useEffect } from 'react';
import './App.css';
import { RectangleContext } from './context/RectangleContext';
import { Dashboard } from './components/Dashboard';
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from 'react-toastify';
import SocketProvider, { socket } from './SocketProvider';
import { RectangleData, rectangleStore } from './store/rectangleStore';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';

const App = observer(() => {
    const store = useContext(RectangleContext);

    useEffect(() => {
      const disposer = reaction(
        ()=> store.rectangles.map(rectangle => ({...rectangle})),
        (newRectangles : RectangleData[]) => {
          localStorage.setItem('rectangles',JSON.stringify(newRectangles))
        }
      )

      const handleStorage = (e: StorageEvent) => {
        if (e.key === "rectangles" && e.newValue){
          if (!socket || !socket?.connected){
            const rectangles = localStorage.getItem("rectangles") || ""
            store.setRectangles(JSON.parse(rectangles) as RectangleData[])

          }
        }
      }

      window.addEventListener("storage",handleStorage)

      return () => {
        disposer()
        window.removeEventListener("storage",handleStorage)
      }
    }, [store]);

  return (
      <SocketProvider>
          <RectangleContext.Provider value={rectangleStore}>
          <Dashboard/>
          <ToastContainer/>
        </RectangleContext.Provider>
      </SocketProvider>
  );
})

export default App;
