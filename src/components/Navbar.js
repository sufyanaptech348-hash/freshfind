import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="app-navbar">
      <div className="nav-logo">Your Logo</div>
      <ul className="nav-links">
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/services">Services</a></li>
        <li><a href="/contact">Contact</a></li>
        {}
      </ul>
      {}
    </nav>
  );
};

export default Navbar;


