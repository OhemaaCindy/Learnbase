const ExpectationSection = () => {
  return (
    <div className=" py-8 sm:py-12">
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column - Course Content */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8 mb-6 lg:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
              What you'll learn
            </h2>
            <div className="space-y-3 sm:space-y-4 text-gray-700 text-sm sm:text-base">
              <p>
                Build 16 web development projects for your portfolio, ready to
                apply for junior developer jobs.
              </p>
              <p>
                After the course you will be able to build ANY website you want.
              </p>
              <p>
                Build fully-fledged websites and web apps for your startup or
                business.
              </p>
              <p>
                Master frontend development with React, Next.js, HTML, CSS, Vue
                and Angular
              </p>
              <p>Master backend development with Node, PHP, Python etc.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpectationSection;
