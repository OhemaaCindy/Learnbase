import { Trash2 } from "lucide-react";
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

interface DeleteProps {
  title: string;
  children: React.ReactNode;
  shadow?: boolean;
  openState: boolean;
  toogleState: (state: boolean) => void;
}
export function DeleteModal({
  title,
  children,
  shadow,
  openState,
  toogleState,
}: DeleteProps) {
  return (
    <AlertDialog open={openState} onOpenChange={toogleState}>
      <AlertDialogTrigger asChild>
        <div className={cn(shadow && "bg-[#fbfbf8] p-3 shadow-md")}>
          <Trash2
            size={20}
            className="text-[#2E2C48] cursor-pointer "
            onClick={() => toogleState(openState)}
          />
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
