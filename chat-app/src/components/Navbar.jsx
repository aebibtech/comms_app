// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';

const handleLogout = () => {
  // Clear the token
  localStorage.removeItem("username");
  localStorage.removeItem("authToken");

  // Navigate to the login page
  window.location.href = '/';
};

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="brand"><Link to="/">Comms</Link></div>
      <div className="links">
        <Link to="/">Home</Link>
        <Link to="/chat">Chat</Link>
        <Link to="/inbox">E-mail</Link>
        <Link to="/smsinbox">SMS</Link>
        <Link to="/virtual-phone">Call</Link>
        <Link to="/register">Register</Link>
        {!localStorage.getItem("authToken") && <Link to="/login">Login</Link>}
        {localStorage.getItem("authToken") && <a onClick={handleLogout} href="javascript:;">Log out</a>}
      </div>
    </nav>
  );
};

export default Navbar;
