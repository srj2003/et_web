import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const userId = localStorage.getItem('userid');
  
  if (!userId) {
    alert('You have been logged out. Please login again.');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;