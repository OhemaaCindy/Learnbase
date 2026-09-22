import React from "react";

interface TechButtonProps {
  name: string;
  color: string;
}

const TechButton: React.FC<TechButtonProps> = ({ name, color }) => {
  return (
    <button
      className="px-6 py-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg text-[#ffffff] text-sm font-medium min-w-[100px]"
      style={{
        borderColor: color,
        backgroundColor: `${color}20`,
      }}
    >
      {name}
    </button>
  );
};

const TechStackSection: React.FC = () => {
  const technologies = [
    { name: "ReactJs", color: "#ffffff" },
    { name: "NextJs", color: "#28ACE2" },
    { name: "NodeJs", color: "#77C053" },
    { name: "Django", color: "#A61D24" },
    { name: "MongoDB", color: "#D89614" },
    { name: "VueJs", color: "#999999" },
    { name: "AWS", color: "#D89614" },
    { name: "Azure", color: "#999999" },
    { name: "PowerBI", color: "#ffffff" },
    { name: "Python", color: "#28ACE2" },
    { name: "Excel", color: "#77C053" },
    { name: "Tableau", color: "#A61D24" },
  ];

  return (
    <div className="relative bg-[#01589A] py-16 px-4 sm:px-6 lg:px-8 mb-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-60 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight w-full">
                What will be next step
              </h2>
              <p className="text-blue-100 text-lg leading-relaxed max-w-lg">
                Discover our diverse stack of solutions, including software
                development, data science, and cloud tools. Sign up today and
                kickstart your journey!
              </p>
            </div>

            {/* Technology Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {technologies.map((tech, index) => (
                <TechButton key={index} name={tech.name} color={tech.color} />
              ))}
            </div>
          </div>
          {/* Right Content - Device Mockups */}
          <div className="hidden lg:block bg-[url('/techStack-bg.png')] bg-no-repeat bg-contain bg-center h-full min-h-[400px] relative">
            <div className="absolute right-2/4 top-3/4 transform -translate-x-1/2 -translate-y-1/2 bg-[url('/mobile.png')] bg-no-repeat bg-contain bg-center h-60 w-40"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechStackSection;
