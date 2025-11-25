import React from "react";
import { Menu, X } from "lucide-react"; // for mobile toggle
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Title */}
          <div className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">
              Cricket Clips
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6 text-gray-700 font-medium">
            <a href="/" className="hover:text-blue-600">
              Home
            </a>
             <a href="/match-wise" className="hover:text-blue-600">
              Matches
            </a>
            <a href="/about" className="hover:text-blue-600">
              About
            </a>
            <a href="/contact" className="hover:text-blue-600">
              Contact
            </a>
            <a
              href="https://www.linkedin.com/in/your-linkedin-username"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600"
            >
              LinkedIn
            </a>
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
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-4 py-2 space-y-2">
            <a href="/" className="block hover:text-blue-600">
              Home
            </a>
            <a href="/about" className="block hover:text-blue-600">
              About
            </a>
            <a href="/contact" className="block hover:text-blue-600">
              Contact
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
