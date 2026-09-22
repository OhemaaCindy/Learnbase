import { useState } from "react";
import {  Settings, FileText } from "lucide-react";
// import LearnerDashboardPage from "./learner-dashboard";
import { InvoiceTable } from "./table";
import SettingsTab from "./setting-tab";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavigationTabProps {
  item: NavItem;
  isActive: boolean;
  onClick: (id: string) => void;
}

const NavigationTab: React.FC<NavigationTabProps> = ({
  item,
  isActive,
  onClick,
}) => (
  <button
    onClick={() => onClick(item.id)}
    className={`
      flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 cursor-pointer 
      ${
        isActive
          ? "bg-[#014273] text-white"
          : "bg-white  hover:bg-blue-200 hover:text-white"
      }
    `}
  >
    <item.icon className="w-4 h-4" />
    <span className="hidden sm:inline">{item.label}</span>
  </button>
);

const NavigationSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("settings");

  const navItems: NavItem[] = [
    // {
    //   id: "dashboard",
    //   label: "Dashboard",
    //   icon: LayoutGrid,
    // },
    {
      id: "invoices",
      label: "Invoices",
      icon: FileText,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    }
    
  ];

  const handleTabClick = (id: string): void => {
    setActiveTab(id);
  };

  return (
    <>
      <div className="w-full bg-[#01589A]  flex items-end h-30  ">
        <div className="container mx-auto  max-w-7xl  bg-white h-11">
          <nav className="flex bg-white   items-end border-b-1 border-[#01589A]">
            {navItems.map((item) => (
              <NavigationTab
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                onClick={handleTabClick}
              />
            ))}
          </nav>
        </div>
      </div>
      {/* {activeTab === "dashboard" && <LearnerDashboardPage />} */}
      {activeTab === "invoices" && <InvoiceTable />}
      {activeTab === "settings" && <SettingsTab />}
    </>
  );
};

export default NavigationSection;
