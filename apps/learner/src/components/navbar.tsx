import React, { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { checkAuthUser } from "@/services/auth-services";
import type { CheckAuthResponse } from "@/types/auth.type";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
interface NavLink {
  name: string;
  href: string;
}

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] =
    useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const navLinks: NavLink[] = [
    { name: "Home", href: "/" },
    { name: "Tracks", href: "/tracks" },
  ];

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileDropdown = (): void => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleRegister = () => {
    navigate("/register");
  };

  const handleRoute = () => {
    navigate("/");
  };

  const handlePortal = () => {
    navigate("/dashboard");
  };
  // only run when there is a user
  const { data: userInfo, isLoading } = useQuery<CheckAuthResponse, Error>({
    queryKey: ["get-info"],
    queryFn: checkAuthUser,
    enabled: !!Cookies.get("token"),
  });

  const info = userInfo?.user;
  const isAuthenticated = !!info;

  function fallbackName(info: { firstName: string; lastName: string }): string {
    return `${info.firstName.split("")[0]}${info.lastName.split("")[0]}`;
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // console.log("🍪 Cookie immediately after logout:", Cookies.get("token"));
    navigate("/");

    Cookies.set("token", "");
    Cookies.remove("token");

    queryClient.removeQueries({ queryKey: ["get-info"] });
    queryClient.clear();

    // console.log("🍪🍪 Cookie immediately after logout:", Cookies.get("token"));
  };

  return (
    <nav className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-16">
          <img
            src="/Icon.png"
            alt="logo"
            className="w-30 h-10 cursor-pointer"
            onClick={handleRoute}
          />
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="nav-link text-gray-700 hover:text-[#01589A] px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center">
            {isAuthenticated ? (
              /* Authenticated User Profile */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleProfileDropdown}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 bg-[#01589A] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {isLoading
                          ? ""
                          : fallbackName({
                              firstName: info?.firstName ?? "",
                              lastName: info?.lastName ?? "",
                            })}
                      </span>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900">
                      {isLoading
                        ? "Loading..."
                        : `${info?.firstName} ${info?.lastName}`}
                    </span>
                    <span className="text-xs text-gray-500 truncate max-w-32">
                      {isLoading ? "" : info?.email}
                    </span>
                  </div>

                  {/* Dropdown Arrow */}
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-[#01589A] rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {isLoading
                              ? ""
                              : fallbackName({
                                  firstName: info?.firstName ?? "",
                                  lastName: info?.lastName ?? "",
                                })}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {isLoading
                              ? "Loading..."
                              : `${info?.firstName} ${info?.lastName}`}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {isLoading ? "" : info?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          handlePortal();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <User className="w-4 h-4 mr-3 text-[#01589A]" />
                        Portal
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <LogOut className="w-4 h-4 mr-3 text-gray-500" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Non-authenticated Auth Buttons */
              <div className="flex items-center space-x-3">
                <button
                  className="flex items-center space-x-2 text-[#01589A] border border-[#01589A] hover:bg-blue-50 px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer"
                  onClick={handleLogin}
                >
                  <span>Login</span>
                  <img src="/blue-arrow.png" alt="arrow" className="h-4 w-4" />
                </button>
                <button
                  className="flex items-center space-x-2 bg-[#01589A] text-white hover:bg-[#015777] px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 shadow-sm cursor-pointer"
                  onClick={handleRegister}
                >
                  <span>sign up</span>
                  <img
                    src="/white-arrow.png"
                    alt="arrow"
                    className="h-4 w-4 text-[#ffffff]"
                  />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}

          {/* Mobile Auth/Profile Section */}
          {isAuthenticated ? (
            /* Mobile Profile Section */
            <div className="pt-4 pb-2 border-t border-gray-100 mt-2">
              <div className="flex items-center space-x-3 px-3 py-3 bg-gray-50 rounded-md mb-3">
                <div className="w-12 h-12 bg-[#01589A] rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {isLoading
                      ? ""
                      : fallbackName({
                          firstName: info?.firstName ?? "",
                          lastName: info?.lastName ?? "",
                        })}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {isLoading
                      ? "Loading..."
                      : `${info?.firstName} ${info?.lastName}`}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {isLoading ? "" : info?.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  className="w-full flex items-center space-x-2 text-[#01589A] border border-[#01589A] hover:bg-blue-50 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200"
                  onClick={() => {
                    handlePortal();
                    setIsMenuOpen(false);
                  }}
                >
                  <User className="w-4 h-4" />
                  <span>Portal</span>
                </button>
                <button
                  className="w-full flex items-center space-x-2 text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            /* Mobile Auth Buttons */
            <div className="pt-4 pb-2 space-y-3">
              <button
                className="w-full flex items-center justify-center space-x-2 text-[#01589A] border border-[#01589A]  hover:bg-blue-50 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200"
                onClick={handleLogin}
              >
                <span>Login</span>
                <img src="/blue-arrow.png" alt="arrow" className="h-4 w-4" />
              </button>
              <button
                className="w-full flex items-center justify-center space-x-2 bg-[#01589A] text-white hover:bg-[#01589A] px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 shadow-sm"
                onClick={handleRegister}
              >
                <span>sign up</span>
                <img
                  src="/white-arrow.png"
                  alt="arrow"
                  className="h-4 w-4 text-[#ffffff]"
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
