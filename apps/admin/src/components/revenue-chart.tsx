interface RevenueData {
  month: string;
  value: number;
}

const RevenueChart: React.FC<{ data: RevenueData[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <div className="bg-white rounded-xl p-10 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Recent Revenue
      </h3>
      <div className="flex items-end justify-between h-70 space-x-2 ">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="w-full flex flex-col justify-end h-40">
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-md transition-all duration-300 hover:from-blue-600 hover:to-blue-400"
                style={{ height: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-2 font-medium">
              {item.month}
            </div>
          </div>
        ))}
      </div>
      {/* <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>0</span>
        <span>1k</span>
        <span>2k</span>
        <span>3k</span>
      </div> */}
    </div>
  );
};

export default RevenueChart;
