import { Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileProps {
  title?: string;
  children: React.ReactNode;
  shadow?: boolean;
}
export function ViewProfileModal({ title, children, shadow }: ProfileProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div className={cn(shadow && "bg-[#fbfbf8] p-3 shadow-md")}>
          <Eye size={20} className="text-[#2E2C48] cursor-pointer " />
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <div className="flex justify-between ">
          <AlertDialogTitle className="font-bold">{title}</AlertDialogTitle>
          <AlertDialogCancel>
            <X color="red" />
          </AlertDialogCancel>
        </div>
        <AlertDialogHeader>{children}</AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
