import { ArrowUp, Linkedin, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <div className="bg-[#01589A]">
      <footer className="flex flex-col lg:flex-row justify-between mx-auto max-w-7xl p-4 sm:p-6 lg:p-10 w-full">
        <div className="flex items-center space-x-2 mb-6 lg:mb-0">
          <img src="/Icon2.png" alt="logo" className="h-10 w-auto sm:w-40" />
        </div>
        {/* Menu Section */}
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 lg:gap-30 w-full lg:w-auto">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Menu</h3>
            <ul className="space-y-2 text-white">
              <li>
                <a
                  href="#"
                  className="hover:text-blue-200 transition-colors duration-200"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-blue-200 transition-colors duration-200"
                >
                  Courses
                </a>
              </li>
            </ul>
          </div>

          <div>
            {/* Contact Section */}
            <h3 className="text-lg font-semibold mb-4 text-white">Contact</h3>
            <div className="space-y-2 text-white">
              <p className="hover:text-blue-200 transition-colors duration-200 cursor-pointer">
                +233594809966
              </p>
              <p className="text-sm">McCarthy, Ghana, Accra</p>
            </div>
          </div>

          {/* Social Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Social</h3>
            <div className="space-y-2 text-white">
              <a
                href="#"
                className="flex items-center space-x-2 hover:text-blue-200 transition-colors duration-200 underline"
              >
                <Linkedin size={16} />
                <span>LinkedIn</span>
              </a>
              <a
                href="#"
                className="flex items-center space-x-2 hover:text-blue-200 transition-colors duration-200 underline"
              >
                <Facebook size={16} />
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
      <div className="bg-[#01589A]">
        <div className="border-t border-blue-500/30 mx-auto max-w-7xl">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
              {/* Copyright */}
              <div className="flex items-center space-x-2 text-sm text-white text-center sm:text-left">
                <span className="text-lg">©</span>
                <span>copyright 2025 - LearnBase, All rights reserved</span>
              </div>

              {/* Back to Top */}
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center space-x-2 hover:text-blue-200 transition-colors duration-200 group text-white"
              >
                <span className="text-sm">Back to top</span>
                <ArrowUp
                  size={16}
                  className="group-hover:transform group-hover:-translate-y-1 transition-transform duration-200"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
