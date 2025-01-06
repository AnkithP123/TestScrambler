"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { X, Plus, Code, ActivityIcon as Function2, GitGraphIcon as Graph } from 'lucide-react'
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Question, Answer, GraphConfig } from '../types/test'
import { EquationEditor } from './equation-editor'
import { GraphEditor } from './graph-editor'
import 'katex/dist/katex.min.css'
import katex from 'katex'

interface QuestionEditorProps {
  question?: Question
  onSave: (question: Question) => void
  onCancel: () => void
}

export function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [text, setText] = useState(question?.text || '')
  const [code, setCode] = useState(question?.code || '')
  const [equation, setEquation] = useState(question?.equation || '')
  const [graph, setGraph] = useState<GraphConfig | undefined>(question?.graph)
  const [answers, setAnswers] = useState<Answer[]>(
    question?.answers || [
      { id: '1', text: '', isCorrect: false },
      { id: '2', text: '', isCorrect: false },
    ]
  )
  const [showCode, setShowCode] = useState(!!question?.code)
  const [showEquation, setShowEquation] = useState(!!question?.equation)
  const [showGraph, setShowGraph] = useState(!!question?.graph)
  const [equationEditorOpen, setEquationEditorOpen] = useState(false)
  const [graphEditorOpen, setGraphEditorOpen] = useState(false)
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null)
  const [changingAnswerId, setChangingAnswerId] = useState<string | null>(null)

  const handleSave = () => {
    console.log('Saving question with current state:', {
      text,
      code,
      equation,
      graph,
      answers
    });
    const newQuestion: Question = {
      id: question?.id || `q-${Date.now()}`,
      text,
      code: showCode ? code : undefined,
      equation: showEquation ? equation : undefined,
      graph: showGraph ? graph : undefined,
      answers
    }
    console.log('Constructed question:', newQuestion);
    onSave(newQuestion)
  }

  const addAnswer = () => {
    setAnswers(prev => [
      ...prev,
      { id: Date.now().toString(), text: '', isCorrect: false }
    ])
  }

  const updateAnswer = (
    id: string,
    updates: Partial<Answer>
  ) => {
    setAnswers(prev =>
      prev.map(a => (a.id === id ? { ...a, ...updates } : a))
    )
  }

  const removeAnswer = (id: string) => {
    setAnswers(prev => prev.filter(a => a.id !== id))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Question Text</label>
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Enter your question here..."
            className="min-h-[100px]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant={showCode ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCode(!showCode)}
          >
            <Code className="w-4 h-4 mr-2" />
            Code Block
          </Button>
          <Button
            type="button"
            variant={showEquation ? "default" : "outline"}
            size="sm"
            onClick={() => setShowEquation(!showEquation)}
          >
            <Function2 className="w-4 h-4 mr-2" />
            Equation
          </Button>
          {/* <Button
            type="button"
            variant={showGraph ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGraph(!showGraph)}
          >
            <Graph className="w-4 h-4 mr-2" />
            Graph
          </Button> */}
        </div>

        {showCode && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Code</label>
            <Textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Enter code here..."
              className="font-mono min-h-[150px]"
            />
          </div>
        )}

        {showEquation && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Equation</label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEquationEditorOpen(true);
                  setChangingAnswerId(null);
                }}
              >
                Open Equation Editor
              </Button>
            </div>
            {equation && (
              <div
                className="p-4 border rounded-md bg-muted"
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(equation, {
                    throwOnError: false,
                    displayMode: true,
                  })
                }}
              />
            )}
          </div>
        )}

        {showGraph && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Graph</label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGraphEditorOpen(true)}
              >
                Open Graph Editor
              </Button>
            </div>
            {graph && (
              <div className="h-[200px] border rounded-md p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={Array.from({ length: 100 }, (_, i) => {
                      const x = graph.xMin + (i * (graph.xMax - graph.xMin)) / 99;
                      const fn = new Function('x', `return ${graph.equation}`);
                      const y = fn(x);
                      return { x, y };
                    })}
                  >
                    {graph.showGrid && <CartesianGrid />}
                    <XAxis
                      dataKey="x"
                      domain={[graph.xMin, graph.xMax]}
                      type="number"
                    />
                    <YAxis
                      domain={[graph.yMin, graph.yMax]}
                      type="number"
                    />
                    <Line
                      type="monotone"
                      dataKey="y"
                      stroke="#2563eb"
                      dot={graph.showPoints}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <label className="text-sm font-medium">Answers</label>
          {answers.map((answer) => (
            <div key={answer.id} className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  value={answer.text}
                  onChange={e =>
                    updateAnswer(answer.id, { text: e.target.value })
                  }
                  placeholder="Enter answer..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant={answer.isCorrect ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateAnswer(answer.id, { isCorrect: !answer.isCorrect })
                  }
                >
                  Correct
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingAnswerId(answer.id)}
                >
                  Add Features
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAnswer(answer.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {answer.code && (
                <pre className="bg-muted p-2 rounded-md text-sm">
                  {answer.code}
                </pre>
              )}
              {answer.equation && (
                <div
                  className="p-2 border rounded-md bg-muted"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(answer.equation, {
                      throwOnError: false,
                      displayMode: true,
                    })
                  }}
                />
              )}
              {answer.graph && (
                <div className="h-[150px] border rounded-md p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={Array.from({ length: 100 }, (_, i) => {
                        const x = answer.graph!.xMin + (i * (answer.graph!.xMax - answer.graph!.xMin)) / 99;
                        const fn = new Function('x', `return ${answer.graph!.equation}`);
                        const y = fn(x);
                        return { x, y };
                      })}
                    >
                      {answer.graph.showGrid && <CartesianGrid />}
                      <XAxis
                        dataKey="x"
                        domain={[answer.graph.xMin, answer.graph.xMax]}
                        type="number"
                      />
                      <YAxis
                        domain={[answer.graph.yMin, answer.graph.yMax]}
                        type="number"
                      />
                      <Line
                        type="monotone"
                        dataKey="y"
                        stroke="#2563eb"
                        dot={answer.graph.showPoints}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAnswer}
            disabled={answers.length >= 6}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Answer
          </Button>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!text || answers.length < 2 || !answers.some(a => a.isCorrect)}
          >
            Save Question
          </Button>
        </div>
      </CardContent>

      <EquationEditor
        open={equationEditorOpen}
        onOpenChange={setEquationEditorOpen}
        initialValue={equation}
        onSave={(eq) => {
          if (changingAnswerId) {
            updateAnswer(changingAnswerId, { equation: eq });
            setChangingAnswerId(null);
          } else {
            setEquation(eq);
          }
          setEquationEditorOpen(false);
        }}
      />

      <GraphEditor
        open={graphEditorOpen}
        onOpenChange={setGraphEditorOpen}
        initialValue={graph}
        onSave={(g) => {
          setGraph(g);
          setGraphEditorOpen(false);
        }}
      />

      {editingAnswerId && (
        <Dialog
          open={true}
          onOpenChange={() => setEditingAnswerId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Features to Answer</DialogTitle>
            </DialogHeader>
            <div className="space-y-8">
              <div className="space-y-2">
                <Label>Code Block</Label>
                <Textarea
                  value={answers.find(a => a.id === editingAnswerId)?.code || ''}
                  onChange={e =>
                    updateAnswer(editingAnswerId, { code: e.target.value })
                  }
                  placeholder="Enter code here..."
                  className="font-mono"
                />
              </div>
              {/* <label className="text-sm font-medium">Equation</label>
              <div className="flex items-center space-x-2">
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingAnswerId(null);
                    setEquationEditorOpen(true);
                  }}
                >
                  Open Equation Editor
                </Button>

              </div> */}

                <div className="space-y-2">
                <Label>Equation</Label>
                <div className=''/>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                  setEditingAnswerId(null);
                  setChangingAnswerId(editingAnswerId);
                  setEquationEditorOpen(true);
                  }}
                >
                  Open Equation Editor
                </Button>
                </div>

              {/* <div className="space-y-2">
                <Label>Equation</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingAnswerId(null);
                    setEquationEditorOpen(true);
                  }}
                >
                  Open Equation Editor
                </Button>
              </div> */}
              {/* <div className="space-y-2">
                <Label>Graph</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingAnswerId(null);
                    setGraphEditorOpen(true);
                  }}
                >
                  Open Graph Editor
                </Button>
              </div>*/}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}

