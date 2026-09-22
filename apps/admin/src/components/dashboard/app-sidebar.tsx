"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "./navbar-main";
import { NavUser } from "./nav-user";
import {
  FileText,
  GraduationCap,
  LayoutDashboard,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export interface NavMainItems {
  title: string;
  url: string;
  icon: LucideIcon;
}
const navMain: NavMainItems[] = [
  {
    title: "Dashboard",
    url: "/overview",
    icon: LayoutDashboard,
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: FileText,
  },
  {
    title: "Learners",
    url: "/learners",
    icon: UsersRound,
  },
  {
    title: "Tracks",
    url: "/tracks",
    icon: GraduationCap,
  },
  {
    title: "Courses",
    url: "/courses",
    icon: GraduationCap,
  },
  {
    title: "Report",
    url: "/report",
    icon: LayoutDashboard,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size={"lg"}
              className="data-[slot=sidebar-menu-button]:!p-1.5 bg-white h-20 "
            >
              {/* <Link to="#"> */}
              <span className="flex items-center justify-center">
                <img
                  src="/images/logo.png"
                  alt="logo"
                  className="w-auto h-8 object-cover"
                />
              </span>
              {/* </Link> */}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar-primary">
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
