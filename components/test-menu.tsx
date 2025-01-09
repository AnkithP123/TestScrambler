import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Menu, Printer, Download, FileText, Copy, Shuffle, Save } from 'lucide-react'

interface TestMenuProps {
  onPrint: () => void;
  onExportPDF: () => void;
  onExportMarkdown: () => void;
  onCopyToClipboard: () => void;
  onScrambleOptions: () => void;
  onViewSaved: () => void;
}

export function TestMenu({
  onPrint,
  onExportPDF,
  onExportMarkdown,
  onCopyToClipboard,
  onScrambleOptions,
  onViewSaved,
}: TestMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Test Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onViewSaved}>
          <Save className="mr-2 h-4 w-4" />
          Saved Questions
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportPDF}>
          <Download className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportMarkdown}>
          <FileText className="mr-2 h-4 w-4" />
          Export as Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopyToClipboard}>
          <Copy className="mr-2 h-4 w-4" />
          Copy to Clipboard
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onScrambleOptions}>
          <Shuffle className="mr-2 h-4 w-4" />
          Scramble Options
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

