const AchievementSection = () => {
  const stats = [
    {
      icon: "/student-cap.png",
      number: "4+",
      label: "Courses",
      color: "text-blue-600",
    },
    {
      icon: "/student-person.png",
      number: "200+",
      label: "Course students",
      color: "text-blue-600",
    },
    {
      icon: "/clock-circle.png",
      number: "250+",
      label: "Hours of content",
      color: "text-blue-600",
    },
  ];

  return (
    <div className="py-8 sm:py-12 lg:py-16">
      <div className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-center mb-4">
          We are proud
        </h1>
        <p className="font-semibold mb-5 text-center max-w-2xl">
          We take pride in our achievements and commitment to excellence. Join
          us in celebrating innovation, growth, and success.
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap justify-center items-stretch gap-8 sm:gap-10 md:gap-12 lg:gap-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center text-center relative min-w-0 sm:min-w-[250px] lg:min-w-0"
            >
              <div className="mb-4">
                <img src={stat.icon} alt="icon" className="w-auto h-auto" />
              </div>
              <div className="flex flex-col items-center space-y-1 sm:space-y-2 flex-grow justify-center">
                <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#01589A] leading-tight">
                  {stat.number}
                </h3>
                <p className="text-gray-700 text-sm sm:text-base md:text-lg lg:text-xl font-medium px-2">
                  {stat.label}
                </p>
              </div>
              {/* Vertical divider line for larger screens */}
              {index < stats.length - 1 && (
                <div className="hidden lg:flex absolute -right-8 top-1/2 transform -translate-y-1/2 w-px h-32 sm:h-40 lg:h-50 bg-[#679BC2]"></div>
              )}
              {/* Horizontal divider line for smaller screens */}
              {index < stats.length - 1 && (
                <div className="flex lg:hidden w-20 h-px bg-gray-200 mx-auto mt-6 sm:mt-8"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementSection;
