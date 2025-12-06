import React from "react";
import { Menu, X, User } from "lucide-react"; // for mobile toggle and avatar
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../actions/userAction";
import { useLocation } from "react-router-dom";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user || {});
  const location = useLocation();
  const handleLogout = () => {
    dispatch(logout());
    window.location.href = "/login";
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Matches", href: "/match-wise" },
    { name: "Series", href: "/series-wise" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "LinkedIn", href: "https://www.linkedin.com/in/rajesh-m-n-a95b5686", external: true },
  ];

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Title and User */}
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-blue-600 tracking-tight">
              Cricket Clips
            </span>
            {user && (
              <span className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full text-blue-700 text-sm font-semibold">
                <User size={20} className="mr-1" />
                {user.username || 'User'}
              </span>
            )}
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6 text-gray-700 font-medium">
            {navLinks.map(link => link.external ? (
              <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                {link.name}
              </a>
            ) : (
              <a
                key={link.name}
                href={link.href}
                className={`hover:text-blue-600 transition-colors ${location.pathname === link.href ? 'text-blue-600 font-bold underline' : ''}`}
              >
                {link.name}
              </a>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors cursor-pointer"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg border-t">
          <div className="px-4 py-2 space-y-2">
            {navLinks.map(link => link.external ? (
              <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" className="block hover:text-blue-600">
                {link.name}
              </a>
            ) : (
              <a
                key={link.name}
                href={link.href}
                className={`block hover:text-blue-600 transition-colors ${location.pathname === link.href ? 'text-blue-600 font-bold underline' : ''}`}
              >
                {link.name}
              </a>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors cursor-pointer mt-2"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
        </nav>
      );
    }

