// import { Separator } from "@/components/ui/separator";
// import { SidebarTrigger } from "@/components/ui/sidebar";

interface SiteHeaderProps {
  title: string;
  description: string;
}

export function SiteHeader({ title, description }: SiteHeaderProps) {
  return (
    <header className="py-4 flex shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {/* <SidebarTrigger className="-ml-1" /> */}
        {/* <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" /> */}
        <div className="flex flex-col space-y-3">
          <h1 className="font-bold text-xl">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="ml-auto flex items-center gap-2"></div>
      </div>
    </header>
  );
}
