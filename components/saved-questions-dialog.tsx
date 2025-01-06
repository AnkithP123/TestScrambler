import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Question } from "../types/test"
import { Edit, Trash2, Code } from 'lucide-react'

interface SavedQuestionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  questions: Question[]
  onEdit: (question: Question) => void
  onDelete: (questionId: string) => void
}

export function SavedQuestionsDialog({
  open,
  onOpenChange,
  questions,
  onEdit,
  onDelete,
}: SavedQuestionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Saved Questions</DialogTitle>
          <DialogDescription>
            View and manage your saved questions
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {questions.map((question) => (
              <div
                key={question.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="font-medium">{question.text}</div>
                    {question.code && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Code className="h-4 w-4 mr-1" />
                        Has code block
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  {question.answers.map((answer) => (
                    <div
                      key={answer.id}
                      className={`text-sm p-2 rounded-md ${
                        answer.isCorrect
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-muted"
                      }`}
                    >
                      {answer.text}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No questions saved yet
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

