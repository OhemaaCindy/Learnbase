"use client";

import {
  // IconCreditCard,
  IconDotsVertical,
  IconLogout,
  // IconNotification,
  IconUserCircle,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLogoutAdmin } from "@/hooks/auth.hook";
import Cookies from "js-cookie";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { checkAuthUser } from "@/services/auth-services";
import type { CheckAuthResponse } from "@/types/types";
import { Skeleton } from "../ui/skeleton";

export function NavUser() {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();

  const { mutate } = useLogoutAdmin();

  const handleLogout = () => {
    mutate();
    Cookies.remove("token");
    navigate("/");
  };

  const { data: userInfo, isLoading } = useQuery<CheckAuthResponse, Error>({
    queryKey: ["get-info"],
    queryFn: checkAuthUser,
  });

  const info = userInfo?.user;

  function fallbackName(info: { firstName: string; lastName: string }): string {
    return `${info.firstName.split("")[0]}${info.lastName.split("")[0]}`;
  }
  const handleNavigation = () => {
    navigate("/profile");
  };
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="text-sidebar-primary-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-foreground cursor-pointer "
            >
              <Avatar className="size-11">
                <AvatarImage src="" alt="user name" />
                <AvatarFallback className="rounded-lg text-black uppercase">
                  {isLoading ? (
                    <Skeleton className="size-full rounded-full bg-amber-400/10" />
                  ) : (
                    fallbackName({
                      firstName: info?.firstName ?? "",
                      lastName: info?.lastName ?? "",
                    })
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {isLoading ? (
                  // "loading"
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-full bg-amber-400/10" />
                    <Skeleton className="h-4 w-full bg-amber-400/10" />
                  </div>
                ) : (
                  <>
                    <span className="truncate font-medium">{`${info?.firstName} ${info?.lastName}`}</span>
                    <span className=" truncate text-xs">{info?.email}</span>
                  </>
                )}
              </div>
              <IconDotsVertical className="ml-auto size-4 " />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg "
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal"></DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleNavigation}
                className="cursor-pointer"
              >
                <IconUserCircle />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
