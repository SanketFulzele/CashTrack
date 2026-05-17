import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBorrower } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2 } from "lucide-react";
import { Borrower } from "@/types";

interface Props {
  borrower: Borrower;
}

export function EditBorrowerDialog({ borrower }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(borrower.name);
  const [phone, setPhone] = useState(borrower.phone ?? "");
  const [notes, setNotes] = useState(borrower.notes ?? "");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () =>
      updateBorrower(borrower.id, {
        name,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowers"] });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent
        className=" w-[90%] max-w-md rounded-xl p-6 animate-in fade-in-0 zoom-in-95 duration-200"
      >
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg font-semibold">
            Edit Borrower
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 animate-in fade-in-0 duration-300">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="Enter borrower name"
              value={name}
              disabled={mutation.isPending}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              placeholder="+91 9876543210"
              value={phone}
              disabled={mutation.isPending}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Optional notes about this borrower"
              value={notes}
              disabled={mutation.isPending}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2"
          >
            {mutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {mutation.isPending ? "Updating..." : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}