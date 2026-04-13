import Signup from './pages/Signup';
import { Route, Routes } from 'react-router-dom';
import Verifyotp from './pages/Verifyotp';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from './pages/Home';


const App = () => {
  return (
    <>
    <Routes>
      <Route path='/signup' element={<Signup/>}/>
      <Route path='/verifyotp' element={<Verifyotp/>}/>
      <Route path='/home' element={<Home/>}/>
    </Routes>
    <ToastContainer />
    </>
  )
}

export default App
