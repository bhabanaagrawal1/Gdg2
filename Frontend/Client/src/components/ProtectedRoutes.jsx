import { Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import app from "../config/firebase";

const auth = getAuth(app);

const ProtectedRoute = ({ children }) => {
  return auth.currentUser ? children : <Navigate to="/" />;
};

export default ProtectedRoute;