import { Monitor, type LucideIcon } from "lucide-react";

interface EnrolledCourseCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
}

export const EnrolledCourseCard = ({
  // icon: Icon,
  title,
  description,

  bgColor,
}: // iconColor,
EnrolledCourseCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Course Image/Icon Section */}
      <div
        className={`${bgColor} h-48 flex items-center justify-center relative`}
      >
        <div className="relative">
          {/* Main illustration */}
          {title === "Software Development" && (
            <div className="relative">
              {/* Laptop screen */}
              <div className="bg-gray-800 w-32 h-20 rounded-lg relative">
                <div className="bg-black w-28 h-16 rounded-md absolute top-2 left-2">
                  {/* Code lines */}
                  <div className="p-2 space-y-1">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-red-400 rounded"></div>
                      <div className="w-1 h-1 bg-yellow-400 rounded"></div>
                      <div className="w-1 h-1 bg-green-400 rounded"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="w-16 h-1 bg-blue-400 rounded"></div>
                      <div className="w-12 h-1 bg-green-400 rounded"></div>
                      <div className="w-20 h-1 bg-purple-400 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Additional windows */}
              <div className="absolute -top-4 -right-6 bg-gray-700 w-16 h-12 rounded opacity-90">
                <div className="p-1">
                  <div className="w-12 h-8 bg-gray-900 rounded text-xs flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
              </div>
              {/* Desk lamp */}
              <div className="absolute -right-12 -top-2">
                <div className="w-1 h-12 bg-gray-600"></div>
                <div className="w-4 h-3 bg-yellow-300 rounded-full -mt-1"></div>
              </div>
            </div>
          )}

          {title === "Data Science Mastery" && (
            <div className="relative">
              {/* Laptop */}
              <div className="bg-purple-600 w-32 h-20 rounded-lg relative">
                <div className="bg-white w-28 h-16 rounded-md absolute top-2 left-2 p-2">
                  {/* Charts */}
                  <div className="flex items-end space-x-1 h-6">
                    <div className="w-2 h-4 bg-purple-400 rounded-t"></div>
                    <div className="w-2 h-6 bg-purple-500 rounded-t"></div>
                    <div className="w-2 h-3 bg-purple-300 rounded-t"></div>
                    <div className="w-2 h-5 bg-purple-600 rounded-t"></div>
                  </div>
                  {/* Graph line */}
                  <div className="mt-1 relative h-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full h-px bg-purple-300 relative">
                        <div
                          className="absolute w-1 h-1 bg-purple-500 rounded-full"
                          style={{ left: "20%", top: "-2px" }}
                        ></div>
                        <div
                          className="absolute w-1 h-1 bg-purple-500 rounded-full"
                          style={{ left: "60%", top: "-4px" }}
                        ></div>
                        <div
                          className="absolute w-1 h-1 bg-purple-500 rounded-full"
                          style={{ left: "80%", top: "-1px" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-6 -left-4 text-purple-300">
                <div className="text-xs">www</div>
              </div>
            </div>
          )}

          {title === "Cloud Computing Expertise" && (
            <div className="relative">
              {/* Laptop */}
              <div className="bg-blue-500 w-24 h-16 rounded-lg relative">
                <div className="bg-white w-20 h-12 rounded-md absolute top-2 left-2"></div>
              </div>
              {/* Server towers */}
              <div className="absolute -right-8 -top-4 space-x-2 flex">
                <div className="bg-gray-800 w-6 h-12 rounded">
                  <div className="w-4 h-1 bg-blue-400 mx-1 mt-1 rounded"></div>
                  <div className="w-4 h-1 bg-green-400 mx-1 mt-1 rounded"></div>
                </div>
                <div className="bg-gray-800 w-6 h-12 rounded">
                  <div className="w-4 h-1 bg-blue-400 mx-1 mt-1 rounded"></div>
                  <div className="w-4 h-1 bg-red-400 mx-1 mt-1 rounded"></div>
                </div>
              </div>
              {/* Connection lines */}
              <div className="absolute top-4 right-2 w-8 h-px bg-blue-300"></div>
              <div className="absolute top-6 right-2 w-8 h-px bg-blue-300"></div>
            </div>
          )}
        </div>
      </div>

      {/* Course Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {description}
        </p>

        <p className="text-[#01589A]">Registered</p>
      </div>
    </div>
  );
};
