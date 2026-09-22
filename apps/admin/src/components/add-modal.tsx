import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, X } from "lucide-react";

interface ModalProps {
  text: string;
  title: string;
  children: React.ReactNode;
  openState: boolean;
  toogleState: (state: boolean) => void;
}
export function AddModal({
  text,
  title,
  openState,
  toogleState,
  children,
}: ModalProps) {
  return (
    <AlertDialog open={openState} onOpenChange={toogleState}>
      <AlertDialogTrigger asChild>
        <div className="flex justify-center items-center text-white bg-[#01589A]  px-4 py-2 gap-2 rounded-md cursor-pointer w-fit">
          <Plus size={18} />
          <button
            className="cursor-pointer"
            onClick={() => toogleState(openState)}
          >
            {text}
          </button>
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

// <AlertDialog>
//   <AlertDialogTrigger asChild>
//     <div className="flex justify-center items-center text-white bg-[#01589A]  px-4 py-2 gap-2 rounded-md cursor-pointer w-fit">
//       <Plus size={18} />
//       <button className="cursor-pointer">{text}</button>
//     </div>
//   </AlertDialogTrigger>

//   <AlertDialogContent>
//     <div className="flex justify-between ">
//       <AlertDialogTitle className="font-bold">{title}</AlertDialogTitle>
//       <AlertDialogCancel>
//         <X color="red" />
//       </AlertDialogCancel>
//     </div>
//     <AlertDialogHeader>{children}</AlertDialogHeader>
//   </AlertDialogContent>
// </AlertDialog>
