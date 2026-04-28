import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  const isAuthenticated = localStorage.getItem("token");

  return (
    isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
  );
};

export default PrivateRoute;


// import { Navigate, Outlet } from "react-router-dom";

// const PrivateRoute = () => {
//   const token = localStorage.getItem("token");

//   return token ? <Outlet /> : <Navigate to="/login" />;
// };

// export default PrivateRoute;
