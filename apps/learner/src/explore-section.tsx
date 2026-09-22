const ExploreSection = () => {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Explore related courses
      </h2>
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 ">
        {/* Data Science Course */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <img
              src="/track-image.png"
              alt="image"
              className="w-30 h-30 object-cover"
            />

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base sm:text-lg mb-2">
                Data Science Mastery
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Equip yourself with the skills to analyze, interpret, and
                leverage data, becoming an expert.
              </p>
            </div>
          </div>
        </div>

        {/* Cloud Computing Course */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <img
              src="/track-image.png"
              alt="image"
              className="w-30 h-30 object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base sm:text-lg mb-2">
                Cloud Computing
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Gain hands-on experience in cloud architecture, preparing you to
                manage scalable solutions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreSection;
