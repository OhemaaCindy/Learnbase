import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Pen, X } from "lucide-react";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  shadow?: boolean;
  openState: boolean;
  toogleState: (state: boolean) => void;
}
export function UpdateModal({
  title,
  children,
  shadow = false,
  openState,
  toogleState,
}: ModalProps) {
  return (
    <AlertDialog open={openState} onOpenChange={toogleState}>
      <AlertDialogTrigger asChild>
        <div className={cn(shadow && "bg-[#fbfbf8] p-3 shadow-md")}>
          <Pen
            size={20}
            className="text-[#01589A] cursor-pointer "
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
