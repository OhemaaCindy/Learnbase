export default function OnboardingSection() {
  return (
    <div className="flex flex-col lg:flex-row max-w-7xl mx-auto mt-8 sm:mt-12 lg:mt-15 mb-16 sm:mb-20 lg:mb-30 gap-20 px-4 sm:px-6 lg:px-0">
      <div className="space-y-6 w-full lg:w-auto">
        {/* Step 1: Sign Up */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6 relative w-full">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#01589A] rounded-l-lg"></div>

          <div className="flex items-start gap-3 sm:gap-4 ml-2 sm:ml-3">
            <img src="/arrowLeft.png" alt="arrow" className="flex-shrink-0" />
            {/* Content */}
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Sign Up and Choose Your Course
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Create your account quickly with just your email or social media
                login, then explore a wide range
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <img src="/ArrowDown.png" alt="arrow" />
        </div>

        {/* Step 2: Onboarding */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <img src="/onboardIcon.png" alt="icon" className="flex-shrink-0" />
            {/* Content */}
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Onboarding
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Get started seamlessly with a smooth onboarding experience.
                Learn the essentials and set yourself up for success from day
                one.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <img src="/ArrowDown.png" alt="arrow" />
        </div>
        {/* Step 3: Start Learning */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <img src="/cap.png" alt="icon" className="flex-shrink-0" />

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Start Learning
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Start your learning journey with practical, hands-on experience.
                Develop the skills needed to build, implement, and manage
                effective solutions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* right section */}
      <div className="shadow-xl rounded-md p-3 sm:p-4 w-full lg:w-auto">
        {/* Steps Section */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-10 ">
          {/* Step 1 - Secure Login */}
          <div className="text-center">
            <div className="mb-4 sm:mb-6">
              <div className="text-xl sm:text-2xl font-bold">1</div>
              <div className="text-base sm:text-lg font-semibold">
                Secure Login
              </div>
            </div>
            <div className="relative flex justify-center items-center">
              <div className="relative">
                <img
                  src="/secure-login.png"
                  alt="image"
                  className="w-full h-auto max-w-24 sm:max-w-none"
                />
              </div>
            </div>
          </div>

          {/* Step 2 - Authentication */}
          <div className="text-center">
            <div className="mb-4 sm:mb-6">
              <div className="text-xl sm:text-2xl font-bold">2</div>
              <div className="text-base sm:text-lg font-semibold">
                Authentication
              </div>
            </div>
            <div className="relative flex justify-center items-center h-32 sm:h-40">
              {/* Person figure with checkmark */}
              <div className="relative">
                <img
                  src="/authenticationImage.png"
                  alt="image"
                  className="w-full h-auto max-w-24 sm:max-w-none"
                />
              </div>
            </div>
          </div>

          {/* Step 3 - Choose a course */}
        </div>

        <div className="flex flex-col mt-6">
          {/* Course Cards Section */}
          <div className="flex flex-col text-center mb-4 sm:mb-6">
            <div className="text-xl sm:text-2xl font-bold">3</div>
            <div className="text-base sm:text-lg font-semibold">
              Choose a course
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Software Development */}
            <div className="rounded-lg p-4 sm:p-5 shadow-sm">
              <div className="flex justify-center mb-3">
                <img src="/iconCarrier.png" alt="icon" />
              </div>

              <h3 className="text-sm font-semibold text-center mb-2">
                Software Development
              </h3>
              <p className="text-gray-600 text-sm text-start mb-3">
                Unlock your potential with comprehensive training in modern
                software development.
              </p>
              <div className="text-center">
                <span className="text-sm text-gray-500">Price: </span>
                <span className="font-semibold">$350</span>
              </div>
            </div>

            {/* Data Science Mastery */}
            <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm">
              <div className="flex justify-center mb-3">
                <img src="/data.png" alt="icon" />
              </div>
              <h3 className="text-sm font-semibold text-center mb-2">
                Data Science Mastery
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Equip yourself with the skills to analyze, interpret, and
                leverage data, covering machine learning.
              </p>
              <div className="text-center">
                <span className="text-sm text-gray-500">Price: </span>
                <span className="font-semibold">$350</span>
              </div>
            </div>

            {/* Cloud Computing Expertise */}
            <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm">
              <div className="flex justify-center mb-3">
                <img src="/cloud.png" alt="icon" />
              </div>
              <h3 className="text-sm font-semibold text-center mb-2">
                Cloud Computing Expertise
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Gain hands-on experience in cloud architecture, preparing you to
                design and manage scalable solutions.
              </p>
              <div className="text-center">
                <span className="text-sm text-gray-500">Price: </span>
                <span className="font-semibold">$350</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
