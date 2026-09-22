"use client";

// import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react";
// import { type Icon } from "@tabler/icons-react";

// import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import type { NavMainItems } from "./app-sidebar";

interface NavMainProps {
  items: NavMainItems[];
}

export function NavMain({ items }: NavMainProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (url: string): boolean => {
    return (
      (pathname === "/" && url === "/") ||
      pathname === url ||
      pathname.startsWith(`${url}/`)
    );
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2 ">
        <SidebarMenu className="flex flex-col gap-4">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                size={"lg"}
                className={cn(
                  "text-sidebar-primary-foreground hover:text-sidebar-primary",
                  isActive(item.url) &&
                    "bg-sidebar-primary-foreground text-sidebar-label hover:bg-sidebar-primary-foreground/80 hover:text-sidebar-label active:bg-sidebar-primary-foreground active:text-sidebar-label min-w-8 duration-200 ease-linear "
                )}
              >
                <Link to={item.url} className="flex items-center gap-2 ">
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
