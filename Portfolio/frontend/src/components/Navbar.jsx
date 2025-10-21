import { useState, useEffect } from "react";
import { Menu, X, Home, Briefcase, User, Mail } from "lucide-react";
// Import your image
import myPhoto from "../assets/images/profile-photo.jpg"; 
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { to: "/", label: "Home", icon: <Home className="w-4 h-4" /> },
    { to: "/projects", label: "Projects", icon: <Briefcase className="w-4 h-4" /> },
    { to: "/about", label: "About", icon: <User className="w-4 h-4" /> },
    { to: "/contact", label: "Contact", icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-gray-900/95 backdrop-blur-lg shadow-lg shadow-black/20"
          : "bg-gray-900/80 backdrop-blur-md"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo with Photo */}
          <a
            href="/"
            className="group flex items-center space-x-3"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
              {/* Replace the gradient box with your photo */}
              <img 
                src={myPhoto} 
                alt="Arogo Logo" 
                className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white/20 group-hover:border-cyan-400 transition-all duration-300"
              />
            </div>
            <span className="hidden sm:block text-white font-bold text-xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Arogo
            </span>
          </a>

          {/* Rest of your code remains the same */}
          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <li key={link.to}>
                <a
                  href={link.to}
                  className="group relative px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="hidden lg:block">{link.icon}</span>
                  <span>{link.label}</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300"></span>
                </a>
              </li>
            ))}
          </ul>

          {/* CTA Button - Desktop */}
          <div className="hidden md:block">
            <a
              href="/contact"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300"
            >
              Hire Me
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="container mx-auto px-4 pb-4">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 space-y-2">
            {navLinks.map((link, idx) => (
              <a
                key={link.to}
                href={link.to}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 group"
                onClick={() => setIsOpen(false)}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <span className="text-blue-400 group-hover:text-cyan-400 transition-colors">
                  {link.icon}
                </span>
                <span className="font-medium">{link.label}</span>
              </a>
            ))}
            
            {/* Mobile CTA */}
            <a
              href="/contact"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 mt-4"
              onClick={() => setIsOpen(false)}
            >
              <Mail className="w-4 h-4" />
              Hire Me
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;