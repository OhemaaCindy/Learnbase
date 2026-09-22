import React, { useState, createContext, useContext } from "react";
import {
  useQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Search,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";

// Theme Context
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={isDark ? "dark" : ""}>{children}</div>
    </ThemeContext.Provider>
  );
};

interface LearnerData {
  id: string;
  name: string;
  email: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  totalHours: number;
  lastActive: string;
  progress: number;
  status: "active" | "inactive" | "completed";
}

interface CourseData {
  name: string;
  enrolled: number;
  completed: number;
  completionRate: number;
}

interface EngagementData {
  month: string;
  activeUsers: number;
  newRegistrations: number;
  completions: number;
}

interface MetricsData {
  totalLearners: number;
  activeLearners: number;
  courseCompletions: number;
  avgProgress: number;
}

// Mock API functions with simulated loading
const fetchMetrics = async (): Promise<MetricsData> => {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return {
    totalLearners: 1247,
    activeLearners: 892,
    courseCompletions: 3456,
    avgProgress: 67,
  };
};

const fetchLearners = async (): Promise<LearnerData[]> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return [
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      coursesEnrolled: 5,
      coursesCompleted: 3,
      totalHours: 42.5,
      lastActive: "2025-08-16",
      progress: 85,
      status: "active",
    },
    {
      id: "2",
      name: "Mike Chen",
      email: "mike.chen@email.com",
      coursesEnrolled: 8,
      coursesCompleted: 8,
      totalHours: 96.2,
      lastActive: "2025-08-15",
      progress: 100,
      status: "completed",
    },
    {
      id: "3",
      name: "Emma Rodriguez",
      email: "emma.r@email.com",
      coursesEnrolled: 3,
      coursesCompleted: 1,
      totalHours: 18.7,
      lastActive: "2025-08-10",
      progress: 45,
      status: "active",
    },
    {
      id: "4",
      name: "David Kumar",
      email: "david.k@email.com",
      coursesEnrolled: 6,
      coursesCompleted: 2,
      totalHours: 31.8,
      lastActive: "2025-08-05",
      progress: 33,
      status: "inactive",
    },
    {
      id: "5",
      name: "Lisa Thompson",
      email: "lisa.t@email.com",
      coursesEnrolled: 4,
      coursesCompleted: 4,
      totalHours: 58.3,
      lastActive: "2025-08-16",
      progress: 100,
      status: "completed",
    },
    {
      id: "6",
      name: "Alex Wilson",
      email: "alex.w@email.com",
      coursesEnrolled: 7,
      coursesCompleted: 5,
      totalHours: 73.1,
      lastActive: "2025-08-14",
      progress: 78,
      status: "active",
    },
    {
      id: "7",
      name: "Maria Garcia",
      email: "maria.g@email.com",
      coursesEnrolled: 2,
      coursesCompleted: 0,
      totalHours: 8.4,
      lastActive: "2025-07-28",
      progress: 15,
      status: "inactive",
    },
    {
      id: "8",
      name: "James Brown",
      email: "james.b@email.com",
      coursesEnrolled: 9,
      coursesCompleted: 7,
      totalHours: 128.6,
      lastActive: "2025-08-17",
      progress: 92,
      status: "active",
    },
  ];
};

const fetchCourseData = async (): Promise<CourseData[]> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return [
    {
      name: "JavaScript Basics",
      enrolled: 324,
      completed: 287,
      completionRate: 88.6,
    },
    {
      name: "React Fundamentals",
      enrolled: 256,
      completed: 198,
      completionRate: 77.3,
    },
    {
      name: "Python Programming",
      enrolled: 412,
      completed: 356,
      completionRate: 86.4,
    },
    {
      name: "Data Analytics",
      enrolled: 189,
      completed: 134,
      completionRate: 70.9,
    },
    {
      name: "UI/UX Design",
      enrolled: 298,
      completed: 245,
      completionRate: 82.2,
    },
    {
      name: "Node.js Backend",
      enrolled: 167,
      completed: 98,
      completionRate: 58.7,
    },
  ];
};

const fetchEngagementData = async (): Promise<EngagementData[]> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return [
    { month: "Feb", activeUsers: 680, newRegistrations: 120, completions: 89 },
    { month: "Mar", activeUsers: 720, newRegistrations: 145, completions: 156 },
    { month: "Apr", activeUsers: 780, newRegistrations: 167, completions: 203 },
    { month: "May", activeUsers: 820, newRegistrations: 189, completions: 234 },
    { month: "Jun", activeUsers: 850, newRegistrations: 156, completions: 267 },
    { month: "Jul", activeUsers: 892, newRegistrations: 178, completions: 298 },
    { month: "Aug", activeUsers: 915, newRegistrations: 134, completions: 187 },
  ];
};

// Loading Components
const MetricCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-blue-100  dark:bg-gray-700 rounded w-24 mb-2"></div>
        <div className="h-8 bg-blue-100  dark:bg-gray-700 rounded w-16 mb-2"></div>
        <div className="h-3 bg-blue-100 dark:bg-gray-700 rounded w-32"></div>
      </div>
      <div className="w-12 h-12 bg-blue-100 dark:bg-gray-700 rounded-lg"></div>
    </div>
  </div>
);

const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="h-6 bg-blue-100 dark:bg-gray-700 rounded w-48 mb-4"></div>
    <div
      className={`bg-blue-100 dark:bg-gray-700 rounded animate-pulse`}
      style={{ height: `${height}px` }}
    ></div>
  </div>
);

const LearnerReportContent = () => {
  const { isDark, toggleTheme } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState("last30days");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  // TanStack Query hooks
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ["metrics", selectedTimeframe],
    queryFn: fetchMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const {
    data: learners,
    isLoading: learnersLoading,
    error: learnersError,
  } = useQuery({
    queryKey: ["learners"],
    queryFn: fetchLearners,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: courseData,
    isLoading: courseLoading,
    error: courseError,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourseData,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: engagementData,
    isLoading: engagementLoading,
    error: engagementError,
  } = useQuery({
    queryKey: ["engagement", selectedTimeframe],
    queryFn: fetchEngagementData,
    staleTime: 5 * 60 * 1000,
  });

  const progressDistribution = [
    { name: "0-25%", value: 18, color: isDark ? "#ef4444" : "#ef4444" },
    { name: "26-50%", value: 24, color: isDark ? "#f97316" : "#f97316" },
    { name: "51-75%", value: 31, color: isDark ? "#eab308" : "#eab308" },
    { name: "76-100%", value: 27, color: isDark ? "#22c55e" : "#22c55e" },
  ];

  const filteredLearners =
    learners?.filter((learner) => {
      const matchesSearch =
        learner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        learner.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || learner.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];

  const getStatusBadge = (status: string) => {
    const styles = {
      active:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      inactive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      completed:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${
      styles[status as keyof typeof styles]
    }`;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-yellow-500";
    if (progress >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["metrics"] });
    queryClient.invalidateQueries({ queryKey: ["learners"] });
    queryClient.invalidateQueries({ queryKey: ["courses"] });
    queryClient.invalidateQueries({ queryKey: ["engagement"] });
  };

  return (
    <div className="min-h-screen dark:bg-gray-900 transition-colors duration-200">
      <div className="p-4 sm:p-6">
        <div className=" ">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Learner Analytics Report
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Comprehensive overview of learner engagement and progress
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                  <span className="hidden sm:inline">
                    {isDark ? "Light" : "Dark"}
                  </span>
                </button>
                <button
                  onClick={handleRefresh}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <RefreshCw size={18} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="last3months">Last 3 Months</option>
                  <option value="lastyear">Last Year</option>
                </select>
                {/* <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download size={18} />
                  <span className="hidden sm:inline">Export</span>
                </button> */}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {metricsLoading ? (
              <>
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </>
            ) : metrics ? (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        Total Learners
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {metrics.totalLearners.toLocaleString()}
                      </p>
                      <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                        ↗ +12.5% vs last month
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Users
                        className="text-blue-600 dark:text-blue-400"
                        size={24}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        Active Learners
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {metrics.activeLearners.toLocaleString()}
                      </p>
                      <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                        ↗ +8.3% vs last month
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <TrendingUp
                        className="text-green-600 dark:text-green-400"
                        size={24}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        Course Completions
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {metrics.courseCompletions.toLocaleString()}
                      </p>
                      <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                        ↗ +15.7% vs last month
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Award
                        className="text-purple-600 dark:text-purple-400"
                        size={24}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        Avg Progress
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {metrics.avgProgress}%
                      </p>
                      <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                        ↗ +5.2% vs last month
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <BookOpen
                        className="text-orange-600 dark:text-orange-400"
                        size={24}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Engagement Trends */}
            {engagementLoading ? (
              <ChartSkeleton />
            ) : engagementData ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Engagement Trends
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={engagementData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? "#374151" : "#e5e7eb"}
                    />
                    <XAxis
                      dataKey="month"
                      stroke={isDark ? "#9ca3af" : "#6b7280"}
                    />
                    <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#ffffff",
                        border: isDark
                          ? "1px solid #374151"
                          : "1px solid #e5e7eb",
                        borderRadius: "8px",
                        color: isDark ? "#ffffff" : "#000000",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Active Users"
                    />
                    <Line
                      type="monotone"
                      dataKey="newRegistrations"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="New Registrations"
                    />
                    <Line
                      type="monotone"
                      dataKey="completions"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Completions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : null}

            {/* Progress Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Progress Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={progressDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {progressDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Learners"]}
                    contentStyle={{
                      backgroundColor: isDark ? "#1f2937" : "#ffffff",
                      border: isDark
                        ? "1px solid #374151"
                        : "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: isDark ? "#ffffff" : "#000000",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4">
                {progressDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {item.name}: {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Course Performance */}
          {courseLoading ? (
            <ChartSkeleton />
          ) : courseData ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Course Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={courseData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? "#374151" : "#e5e7eb"}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={isDark ? "#9ca3af" : "#6b7280"}
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#1f2937" : "#ffffff",
                      border: isDark
                        ? "1px solid #374151"
                        : "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: isDark ? "#ffffff" : "#000000",
                    }}
                  />
                  <Bar dataKey="enrolled" fill="#3b82f6" name="Enrolled" />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {/* Learner Details Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">
                Learner Details
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search learners..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-auto"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {learnersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="h-6  bg-blue-100 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-6  bg-blue-100 dark:bg-gray-700 rounded w-1/6"></div>
                      <div className="h-6  bg-blue-100 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-6  bg-blue-100 dark:bg-gray-700 rounded w-1/6"></div>
                      <div className="h-6  bg-blue-100 dark:bg-gray-700 rounded w-1/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 dark:text-gray-300">
                        Learner
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 dark:text-gray-300">
                        Courses
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 dark:text-gray-300">
                        Progress
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                        Hours
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 dark:text-gray-300 hidden md:table-cell">
                        Last Active
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLearners.map((learner) => (
                      <tr
                        key={learner.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-3 sm:py-4 px-2 sm:px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                              {learner.name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {learner.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4">
                          <div className="text-xs sm:text-sm">
                            <p className="text-gray-900 dark:text-white">
                              {learner.coursesCompleted}/
                              {learner.coursesEnrolled}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400">
                              Completed/Enrolled
                            </p>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 min-w-0">
                              <div
                                className={`h-2 rounded-full ${getProgressColor(
                                  learner.progress
                                )}`}
                                style={{ width: `${learner.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {learner.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-gray-900 dark:text-white text-sm hidden sm:table-cell">
                          {learner.totalHours}h
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-gray-900 dark:text-white text-sm hidden md:table-cell">
                          {learner.lastActive}
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4">
                          <span className={getStatusBadge(learner.status)}>
                            {learner.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!learnersLoading && filteredLearners.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No learners found matching your criteria.
                </p>
              </div>
            )}

            {/* Error States */}
            {(metricsError ||
              learnersError ||
              courseError ||
              engagementError) && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-800 dark:text-red-400">
                  Error loading data. Please try refreshing the page.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LearnerReportPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LearnerReportContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default LearnerReportPage;
