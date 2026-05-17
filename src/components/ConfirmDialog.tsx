import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  trigger: React.ReactNode;
  title: string;
  description: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  onConfirm,
  loading = false,
}: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>

      <AlertDialogContent className="w-[90%] max-w-md rounded-xl p-6">
        <AlertDialogHeader className="space-y-2">
          <AlertDialogTitle className="text-xl font-semibold">
            {title}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-md text-muted-foreground leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter
          className="
            
            flex
            flex-row
            items-center
            justify-between
            gap-3
          "
        >
          <AlertDialogCancel className="flex-1 h-10 text-sm font-medium m-0">
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="
              flex-1
              h-10
              text-sm
              font-medium
              bg-destructive
              text-destructive-foreground
              hover:bg-destructive/90
            "
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}