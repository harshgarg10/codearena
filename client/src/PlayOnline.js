import React from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from './utils/isAuthenticated';
import { useEffect } from 'react';
const PlayOnline = () => {
  const navigate = useNavigate();

    useEffect(() => {
    if (!isAuthenticated()) {
        navigate('/login');
    }
    }, []);
  
  return (
    <div>...your Play Online UI...</div>
  );
};
export default PlayOnline;
