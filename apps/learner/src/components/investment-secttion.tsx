const InvestmentSecttion = () => {
  return (
    <div className="relative">
      <div className="flex px-4 sm:px-8 lg:px-12 xl:px-50 py-8 sm:py-10 bg-[url('/codeImage.jpg')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 opacity-60 bg-[#034A81]"></div>

        {/* Content wrapper */}
        <div className="mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-between w-full gap-8 sm:gap-12 lg:gap-20 xl:gap-80 relative z-10">
          <div className="flex flex-col justify-center text-white text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight mb-4">
              It's time to start investing in yourself
            </h1>
            <p className="font-semibold mb-5 max-w-md lg:max-w-lg xl:w-108">
              Online courses open the opportunity for learning to almost anyone,
              regardless of their scheduling commitments.
            </p>
          </div>
          {/* right section */}
          <div className="pt-2 flex-shrink-0">
            <button
              className="bg-[#01589A] hover:bg-blue-500 border border-white text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-sm text-base sm:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 cursor-pointer"
              onClick={() => {
                document.getElementById("onboarding-section")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              Get started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSecttion;
