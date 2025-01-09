import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import 'katex/dist/katex.min.css'
import katex from 'katex'
import Editor from './editor'

interface EquationEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: string;
  onSave: (equation: string) => void;
}

export class StringWrapper {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  setValue(value: string) {
    this.value = value;
  }
}

export function EquationEditor({
  open,
  onOpenChange,
  initialValue = '',
  onSave,
}: EquationEditorProps) {

  const [equation, setEquation] = useState(new StringWrapper(initialValue));
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [one, setOne] = useState('');
  const [actualValue, setActualValue] = useState(initialValue);

  const handlePreview = () => {
    try {
      const rendered = katex.renderToString(equation.value, {
        throwOnError: true,
        displayMode: true,
      });
      setPreview(rendered);
      setError('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const setValue = (value: string) => {
    setActualValue(value);
    equation.setValue(value);
  }

  const onOpenChange2 = () => {
    console.log('HI');
    const element = document.getElementsByClassName('rounded-sm')[0];
    element.addEventListener('click', () => {
      console.log('clicked');
      onOpenChange(false);
    });
  }

  return (
      <Dialog open={open} onOpenChange={onOpenChange2}>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Equation Editor</DialogTitle>
          <DialogDescription>
            Enter your LaTeX equation. Use the preview to check the formatting.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
          <div className="grid gap-2">
            <Label htmlFor="equation">LaTeX Equation</Label>
            <Input
              id="equation"
              value={actualValue}
              onChange={(e) => {setValue(e.target.value)} }
              placeholder="\frac{-b \pm \sqrt{b^2-4ac}}{2a}"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              className="w-full"
            >
              Preview
            </Button>
          </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          {preview && (
            <div
              className="p-4 border rounded-md bg-muted"
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          )}
          <div>
            <Label htmlFor="mathfield">Or modify the equation directly here: </Label>
            <Editor
              equation={equation}
              set={setValue}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => onSave(equation.value)}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
  );
}
