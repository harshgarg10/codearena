import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../utils/isAuthenticated';

const ProtectedRoute = () => {
  const authed = isAuthenticated();

  // If authorized, return an outlet that will render child elements
  // If not, return element that will navigate to login page
  return authed ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;