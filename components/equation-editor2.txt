import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { MathfieldElement } from 'mathlive'; // Import MathfieldElement from mathlive

interface EquationEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: string;
  onSave: (equation: string) => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export function EquationEditor({
  open,
  onOpenChange,
  initialValue = '',
  onSave,
}: EquationEditorProps) {
  const [equation, setEquation] = useState(initialValue);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [showMathKeyboard, setShowMathKeyboard] = useState(false);
  const mathfieldRef = useRef<MathfieldElement | null>(null); // Ref for MathfieldElement

  // Update preview whenever equation changes
  const handlePreview = () => {
    try {
      const rendered = katex.renderToString(equation, {
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

  // Toggle math keyboard visibility
  const handleMathKeyboardToggle = () => {
    setShowMathKeyboard(!showMathKeyboard);
  };

  // Handle input from the MathfieldElement (math keyboard)
  const handleMathKeyboardInput = () => {
    if (mathfieldRef.current) {
      setEquation(mathfieldRef.current.getValue());
    }
  };

  // Effect to handle the initial value for mathfield when showMathKeyboard is true
  useEffect(() => {
    if (mathfieldRef.current) {
      mathfieldRef.current.setValue(equation); // Sync equation state with MathfieldElement
    }
  }, [equation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
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
            <Button
              type="button"
              variant="outline"
              onClick={handleMathKeyboardToggle}
              className="w-full mt-2"
            >
              {showMathKeyboard ? 'Hide Math Keyboard' : 'Show Math Keyboard'}
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
          {showMathKeyboard && (
            <div className="mt-4">
              <math-field
                ref={mathfieldRef} // Attach the ref here
                id="math-keyboard"
                virtual-keyboard-mode="onfocus"
                onInput={handleMathKeyboardInput}
              ></math-field>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => onSave(equation)}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
