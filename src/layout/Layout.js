// src/layout/Layout.js
import React from 'react';
import Navbar from '../component/navbar/Navbar';
import { Outlet } from 'react-router-dom';
import style from './Layout.module.css';

const Layout = () => {
  return (
    <div className={style.layoutContainer}>
      <Navbar />
      <div className={style.mainContent}>
        <Outlet />
      </div>
    </div>
    
  );
};

export default Layout;
