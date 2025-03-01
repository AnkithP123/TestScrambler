import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ScrambleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numVersions: string;
  setNumVersions: (value: string) => void;
  scrambleQuestions: boolean;
  setScrambleQuestions: (value: boolean) => void;
  scrambleAnswers: boolean;
  setScrambleAnswers: (value: boolean) => void;
  onGenerate: () => void;
}

export function ScrambleDialog({
  open,
  onOpenChange,
  numVersions,
  setNumVersions,
  scrambleQuestions,
  setScrambleQuestions,
  scrambleAnswers,
  setScrambleAnswers,
  onGenerate,
}: ScrambleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scramble Options</DialogTitle>
          <DialogDescription>
            Configure how you want to generate different versions of your test.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="versions">Number of Versions</Label>
            <input
              type="number"
              id="versions"
              value={numVersions}
              onChange={(e) => setNumVersions(e.target.value)}
              className="w-32 border rounded px-2 py-1"
              min="1"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="scramble-questions">Scramble Questions</Label>
            <Switch
              id="scramble-questions"
              checked={scrambleQuestions}
              onCheckedChange={setScrambleQuestions}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="scramble-answers">Scramble Answers</Label>
            <Switch
              id="scramble-answers"
              checked={scrambleAnswers}
              onCheckedChange={setScrambleAnswers}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onGenerate}>Generate Versions</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

