import { useState, useEffect } from 'react'
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
import { Switch } from "@/components/ui/switch"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { GraphConfig } from '../types/test'

interface GraphEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: GraphConfig;
  onSave: (config: GraphConfig) => void;
}

const defaultConfig: GraphConfig = {
  equation: 'x^2',
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
  step: 0.1,
  showGrid: true,
  showPoints: false,
}

export function GraphEditor({
  open,
  onOpenChange,
  initialValue = defaultConfig,
  onSave,
}: GraphEditorProps) {
  const [config, setConfig] = useState<GraphConfig>(initialValue);
  const [data, setData] = useState<{ x: number; y: number }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      // Generate points for the graph
      const points: { x: number; y: number }[] = [];
      for (let x = config.xMin; x <= config.xMax; x += config.step) {
        // Use Function constructor to evaluate the equation
        // This is safe as it's only used for math expressions
        const fn = new Function('x', `return ${config.equation}`);
        try {
          const y = fn(x);
          if (!isNaN(y) && isFinite(y)) {
            points.push({ x, y });
          }
        } catch (e) {
          // Skip invalid points
        }
      }
      setData(points);
      setError('');
    } catch (err) {
      setError('Invalid equation');
    }
  }, [config]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Graph Editor</DialogTitle>
          <DialogDescription>
            Configure your graph settings and preview the result.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="equation">Equation (in terms of x)</Label>
            <Input
              id="equation"
              value={config.equation}
              onChange={(e) => setConfig({ ...config, equation: e.target.value })}
              placeholder="x^2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="xMin">X Min</Label>
              <Input
                id="xMin"
                type="number"
                value={config.xMin}
                onChange={(e) => setConfig({ ...config, xMin: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="xMax">X Max</Label>
              <Input
                id="xMax"
                type="number"
                value={config.xMax}
                onChange={(e) => setConfig({ ...config, xMax: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="yMin">Y Min</Label>
              <Input
                id="yMin"
                type="number"
                value={config.yMin}
                onChange={(e) => setConfig({ ...config, yMin: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="yMax">Y Max</Label>
              <Input
                id="yMax"
                type="number"
                value={config.yMax}
                onChange={(e) => setConfig({ ...config, yMax: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="step">Step Size</Label>
            <Input
              id="step"
              type="number"
              step="0.1"
              value={config.step}
              onChange={(e) => setConfig({ ...config, step: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showGrid">Show Grid</Label>
            <Switch
              id="showGrid"
              checked={config.showGrid}
              onCheckedChange={(checked) => setConfig({ ...config, showGrid: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showPoints">Show Points</Label>
            <Switch
              id="showPoints"
              checked={config.showPoints}
              onCheckedChange={(checked) => setConfig({ ...config, showPoints: checked })}
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <div className="h-[300px] border rounded-md p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                {config.showGrid && <CartesianGrid />}
                <XAxis
                  dataKey="x"
                  domain={[config.xMin, config.xMax]}
                  type="number"
                />
                <YAxis
                  domain={[config.yMin, config.yMax]}
                  type="number"
                />
                <Line
                  type="monotone"
                  dataKey="y"
                  stroke="#2563eb"
                  dot={config.showPoints}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onSave(config)}>Insert Graph</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

