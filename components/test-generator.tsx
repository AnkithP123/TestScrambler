"use client"

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { QuestionEditor } from './question-editor'
import { TestMenu } from './test-menu'
import { ScrambleDialog } from './scramble-dialog'
import { useTestGenerator } from '@/hooks/useTestGenerator'
import { Question, TestVersion } from '@/types/test'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from 'lucide-react'
import { SavedQuestionsDialog } from '@/components/saved-questions-dialog'
import jsPDF from 'jspdf'
import katex from 'katex'
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import fs from 'fs';
import HTMLtoDOCX from 'html-to-docx'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'


import { Canvg } from 'canvg'

export default function TestGenerator() {
  const {
    questions,
    versions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    generateVersions,
    clearAllData,
    initialized
  } = useTestGenerator()

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [numVersions, setNumVersions] = useState("1")
  const [scrambleQuestions, setScrambleQuestions] = useState(false)
  const [scrambleAnswers, setScrambleAnswers] = useState(false)
  const [scrambleDialogOpen, setScrambleDialogOpen] = useState(false)
  const [savedQuestionsOpen, setSavedQuestionsOpen] = useState(false)
  const printFrameRef = useRef<HTMLIFrameElement>(null)

  // if (!initialized) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <Loader2 className="h-8 w-8 animate-spin" />
  //     </div>
  //   );
  // }

  if (!questions) {
    console.error('Questions array is undefined');
    return null;
  }

  if (!versions) {
    console.error('Versions array is undefined');
    return null;
  }

  const handleSaveQuestion = (question: Question) => {
    console.log('Handling save question:', question);
    if (!addingQuestion && editingQuestion) {
      console.log('Updating existing question:', editingQuestion.id);
      updateQuestion(editingQuestion.id, question);
    } else {
      console.log('Adding new question');
      addQuestion(question);
    }
    setEditingQuestion(null);
    setAddingQuestion(false);
  };

  const handlePrint = () => {
    // TODO: Implement print functionality
  }
  const handleExportPDF = async () => {
    // Helper function to render LaTeX to image data
    const renderLatexToImage = async (latex: string, scale = 5): Promise<{ dataUrl: string; width: number; height: number }> => {
      const container = document.createElement('div');
      const style = document.createElement('style');
      style.textContent = `
        .katex .mfrac .frac-line {
          transform: translateY(0.5em);
        }
        svg {
          transform: translateY(1px);
        }
      `;
      document.head.appendChild(style);
      
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      
      document.body.appendChild(container);
    
      try {
        const html = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: true,
          strict: true,
          output: 'html'
        });
        container.innerHTML = html;
        
        const katexElement = container.firstChild as HTMLElement;
        const canvas = await html2canvas(katexElement, {
          scale: scale,
          backgroundColor: null,
          height: katexElement.offsetHeight * 2 // Manually make the canvas taller
        });

        // Trim blank areas from the top and bottom of the canvas
        const trimmedCanvas = document.createElement('canvas');
        const trimmedCtx = trimmedCanvas.getContext('2d');
        const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
        
        if (imageData && trimmedCtx) {
          let top = 0;
          let bottom = imageData.height;

          // Find the top boundary
          for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
              const alpha = imageData.data[(y * imageData.width + x) * 4 + 3];
              if (alpha > 0) {
          top = y;
          break;
              }
            }
            if (top > 0) break;
          }

          // Find the bottom boundary
          for (let y = imageData.height - 1; y >= 0; y--) {
            for (let x = 0; x < imageData.width; x++) {
              const alpha = imageData.data[(y * imageData.width + x) * 4 + 3];
              if (alpha > 0) {
          bottom = y;
          break;
              }
            }
            if (bottom < imageData.height) break;
          }

          const trimmedHeight = bottom - top + 1;
          trimmedCanvas.width = canvas.width;
          trimmedCanvas.height = trimmedHeight;
          trimmedCtx.putImageData(imageData, 0, -top);
        }

        
        
        const imageData2 = trimmedCanvas.toDataURL('image/png');

        document.body.removeChild(container);
        return {
          dataUrl: imageData2,
          width: trimmedCanvas.width / scale,
          height: trimmedCanvas.height / scale
        };
      } catch (error) {
        console.error('LaTeX rendering error:', error);
        document.body.removeChild(container);
        return {
          dataUrl: '',
          width: 0,
          height: 0
        };
      }
    };
    
    const generatePDF = async (version: TestVersion, vIndex: number) => {
      const letter = String.fromCharCode(65 + vIndex);
      const doc = new jsPDF({
        unit: 'pt',
        format: 'letter',
        orientation: 'portrait'
      });

      // Set up fonts
      doc.setFont("helvetica");
      
      // Constants for layout
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 40;
      const contentWidth = pageWidth - (2 * margin);
      const lineHeight = 16;
      
      // Helper function to add a new page with consistent margins
      const addNewPage = () => {
        doc.addPage();
        doc.setFont("helvetica");
        return margin;
      };

      // Helper function to check if content will fit on current page
      const willContentFit = (currentY: number, contentHeight: number) => {
        return (currentY + contentHeight) < (pageHeight - margin);
      };

      // Helper function to wrap text
      const getWrappedText = (text: string, maxWidth: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
          const width = doc.getTextWidth(currentLine + ' ' + word);
          if (width < maxWidth) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        });
        if (currentLine) {
          lines.push(currentLine);
        }
        return lines;
      };

      // Helper function to add text with line breaks
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number): number => {
        const lines = getWrappedText(text, maxWidth);
        lines.forEach((line, i) => {
          doc.text(line, x, y + (i * lineHeight));
        });
        return y + (lines.length * lineHeight);
      };

      // Helper function to add code block
      const addCodeBlock = (code: string, x: number, y: number, width: number): number => {
        const padding = 8; // Reduced padding
        // Remove background and border colors
        
        // Split code into lines and calculate height
        const codeLines = code.split('\n');
        const codeLineHeight = 14;
        const totalHeight = (codeLines.length * codeLineHeight) + (padding * 2);
        
        // Add code text
        doc.setFont("Courier"); // Monospace font for code
        doc.setFontSize(11);
        doc.setTextColor(33, 37, 41); // Dark gray text
        
        codeLines.forEach((line, index) => {
          doc.text(line, x + padding, y + padding + (index * codeLineHeight));
        });
        
        // Reset styles
        doc.setFont("helvetica");
        doc.setFontSize(12);
        doc.setTextColor(0);
        
        return y + totalHeight + 4; // Reduced bottom spacing
      };
      
      // Start with the header
      let y = margin;

      // Add version letter (top right)
      doc.setFontSize(48);
      doc.text(letter, pageWidth - margin - doc.getTextWidth(letter), y + 24);

      // Add title and form fields
      doc.setFontSize(24);
      doc.text("Final Exam", margin, y + 24);
      
      doc.setFontSize(12);
      y += 60;
      // doc.text("Name: _________________________________", margin, y);
      // doc.text("Date: ________________", pageWidth - margin - 150, y);
      
      // y += 24;
      // doc.text("Period: _______", margin, y);
      // doc.text("Student ID: ________________", pageWidth - margin - 150, y);
      
      y += 48;
      // Process each question
      for (let qIndex = 0; qIndex < version.questions.length; qIndex++) {
        const question = version.questions[qIndex];
        const questionNumber = `${qIndex + 1}.`;
        
        // Calculate total height needed for this question
        let questionHeight = lineHeight;
        const questionTextLines = getWrappedText(question.text, contentWidth - 40);
        questionHeight += questionTextLines.length * lineHeight;
        
        if (question.code) {
          const codeLines = question.code.split('\n').length;
          questionHeight += (codeLines * 14) + 32; // Code height + padding
        }
        
        if (question.equation) {
          questionHeight += 80; // Estimated height for equation
        }
        
        // Height for answers
        const answersHeight = await question.answers.reduce(async (heightPromise: Promise<number>, answer: { text: string; code?: string; equation?: string }) => {
          const height = await heightPromise;
          const answerLines = getWrappedText(answer.text, contentWidth - 60);
          let answerHeight = answerLines.length * lineHeight;
          if (answer.code) {
            const codeLines = answer.code.split('\n').length;
            answerHeight += (codeLines * 14) + 32;
          }
          if (answer.equation) answerHeight += 80;
          return height + answerHeight + 16;
        }, Promise.resolve(0));
        
        questionHeight += answersHeight;
        questionHeight += 40;

        // Check if we need a new page
        if (!willContentFit(y, questionHeight)) {
          y = addNewPage();
        }

        // Question number and text
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(questionNumber, margin, y);
        doc.setFont("helvetica", "normal");
        y = addWrappedText(question.text, margin + 20, y, contentWidth - 40);
        
        // Code block
        if (question.code) {
          y += 8;
          y = addCodeBlock(question.code, margin, y, contentWidth);
        }
        
        // Equation
        if (question.equation) {
          y += 8;
          try {
            const equationData = await renderLatexToImage(question.equation);
            if (equationData.dataUrl) {
              // Scale down if wider than content width
              let imgWidth = equationData.width;
              let imgHeight = equationData.height;

              console.log('LATEX:', question.equation);
              console.log('Equation data:', equationData);
              
              if (imgWidth > contentWidth) {
                const scale = contentWidth / imgWidth;
                imgWidth = contentWidth;
                imgHeight = equationData.height * scale;
              }
              
              doc.addImage(equationData.dataUrl, 'PNG', margin + 10, y, imgWidth, imgHeight);
              y += imgHeight + 24; // Added extra spacing after equation
            }
          } catch (error) {
            console.error('Error rendering equation:', error);
            y = addWrappedText(question.equation, margin + 10, y, contentWidth - 20);
            y += 24; // Added extra spacing after equation
          }
        }
        
        // Answers
        y += 8;
        const answersWithCodeOrEquation = question.answers.some(answer => answer.code || answer.equation);
        const answersWithExtraLongAnswer = question.answers.some(answer => doc.getTextWidth(answer.text) > (contentWidth - 60) / 2);

        if (question.text.startsWith("Hello")) {
          console.log('Question:', question);
          console.log('Answers with code or equation:', answersWithCodeOrEquation);
          console.log('Answers with extra long answer:', answersWithExtraLongAnswer);
          for (const [aIndex, answer] of question.answers.entries()) {
            console.log('Answer:', answer);
            const answerLetter = `${String.fromCharCode(65 + aIndex)}.`;
            console.log('Length:', doc.getTextWidth(answer.text));
            console.log('Column width:', (contentWidth - 60) / 2);
          }
        }
        if (answersWithCodeOrEquation || answersWithExtraLongAnswer) {
          for (const [aIndex, answer] of question.answers.entries()) {
            const answerLetter = `${String.fromCharCode(65 + aIndex)}.`;
            doc.setFont("helvetica", "bold");
            doc.text(answerLetter, margin + 20, y);
            doc.setFont("helvetica", "normal");
            y = addWrappedText(answer.text, margin + 40, y, contentWidth - 60);
            
            if (answer.code) {
              y += 8;
              y = addCodeBlock(answer.code, margin + 40, y, contentWidth - 60);
            }
            
            if (answer.equation) {
              y += 8;
              try {
                const equationData = await renderLatexToImage(answer.equation);
                if (equationData.dataUrl) {
                  // Scale down if wider than available answer width
                  let imgWidth = equationData.width;
                  let imgHeight = equationData.height;
                  const maxWidth = contentWidth - 60; // Account for answer indentation
                  
                  if (imgWidth > maxWidth) {
                    const scale = maxWidth / imgWidth;
                    imgWidth = maxWidth;
                    imgHeight = equationData.height * scale;
                  }
                  
                  doc.addImage(equationData.dataUrl, 'PNG', margin + 50, y, imgWidth, imgHeight);
                  y += imgHeight + 16;
                }
              } catch (error) {
                console.error('Error rendering answer equation:', error);
                y = addWrappedText(answer.equation, margin + 50, y, contentWidth - 80);
                y += 16;
              }
            }
                
            y += 16;
          }
        } else {
          const columnWidth = (contentWidth - 60) / 2;
          let colY = y;
          for (let aIndex = 0; aIndex < question.answers.length; aIndex += 2) {
            const answer1 = question.answers[aIndex];
            const answer2 = question.answers[aIndex + 1];
            
            const answerLetter1 = `${String.fromCharCode(65 + aIndex)}.`;
            const answerLetter2 = answer2 ? `${String.fromCharCode(65 + aIndex + 1)}.` : '';

            const colX1 = margin + 20;
            const colX2 = margin + 20 + columnWidth + 20;

            doc.setFont("helvetica", "bold");
            doc.text(answerLetter1, colX1, colY);
            doc.setFont("helvetica", "normal");
            const answer1Height = addWrappedText(answer1.text, colX1 + 20, colY, columnWidth - 20);

            if (answer2) {
              doc.setFont("helvetica", "bold");
              doc.text(answerLetter2, colX2, colY);
              doc.setFont("helvetica", "normal");
              const answer2Height = addWrappedText(answer2.text, colX2 + 20, colY, columnWidth - 20);
              colY = Math.max(answer1Height, answer2Height);
            } else {
              colY = answer1Height;
            }
            colY += lineHeight;
          }
          y = colY + 16;
        }
        
        y += 24;
      }

      // Return the PDF as a Blob
      return doc.output('blob');
    };

    // Generate a PDF for each version and add to zip
    const zip = new JSZip();
    for (let i = 0; i < versions.length; i++) {
      const pdfBlob = await generatePDF(versions[i], i);
      const letter = String.fromCharCode(65 + i);
      zip.file(`Test_Version_${letter}.pdf`, pdfBlob);
    }

    // Generate the zip file and trigger download
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'Test_Versions.zip');

    const style = document.querySelector('style');
    if (style) {
      document.head.removeChild(style);
    }
  };
    // Function to render LaTeX to an image
  const renderLatexToImage = (latex: string): Promise<{ dataUrl: string, width: number, height: number }> => {
    return new Promise((resolve, reject) => {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.visibility = 'hidden';
      document.body.appendChild(container);
  
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, container]);
      MathJax.Hub.Queue(() => {
        container.innerHTML = `\\(${latex}\\)`;
        const svg = container.querySelector('svg');
        if (!svg) {
          reject('Failed to render LaTeX');
          return;
        }
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          if (ctx) {
            ctx.drawImage(img, 0, 0);
          } else {
            reject('Failed to get canvas context');
          }
          const dataUrl = canvas.toDataURL('image/png');
          resolve({ dataUrl, width: img.width, height: img.height });
          URL.revokeObjectURL(url);
        };
        img.src = url;
      });
    });
  };
  
  const handleExportText = () => {
    const text = versions.map((version, vIndex) => {
      return `Test Version ${vIndex + 1}\n\n` +
        version.questions.map((q, qIndex) => {
          const questionText = `${qIndex + 1}. ${q.text}\n` +
            (q.code ? `\n${q.code}\n` : '') +
            (q.equation ? `\n${q.equation}\n` : '');

          const answersWithCodeOrEquation = q.answers.some(answer => answer.code || answer.equation);
          const answersWithExtraLongAnswer = q.answers.some(answer => answer.text.length > 50);

          let answersText = '';
          if (answersWithCodeOrEquation || answersWithExtraLongAnswer) {
            answersText = '\n' + q.answers.map((a, aIndex) => {
              return `\t${String.fromCharCode(65 + aIndex)}. ${a.text}\n` +
                (a.code ? `\n${a.code}\n` : '') +
                (a.equation ? `\n${a.equation}\n` : '');
            }).join('\n');
          } else {
            const columnWidth = Math.ceil(q.answers.length / 2);
            for (let i = 0; i < columnWidth; i++) {
              const answer1 = q.answers[i];
              const answer2 = q.answers[i + columnWidth];
              answersText += `\n\t${String.fromCharCode(65 + i)}. ${answer1.text}  `;
              if (answer2) {
                answersText += `${String.fromCharCode(65 + i + columnWidth)}. ${answer2.text}\n`;
              } else {
                answersText += '\n';
              }
            }
          }

          return questionText + answersText;
        }).join('\n');
    }).join('\n---\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-versions.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const handleCopyToClipboard = () => {
    const text = versions.map((version, vIndex) => {
      return `Test Version ${vIndex + 1}\n\n` +
        version.questions.map((q, qIndex) => {
          const questionText = `${qIndex + 1}. ${q.text}\n` +
            (q.code ? `\`\`\`\n${q.code}\n\`\`\`\n` : '') +
            (q.equation ? `$$${q.equation}$$\n` : '');

          const answersWithCodeOrEquation = q.answers.some(answer => answer.code || answer.equation);
          const answersWithExtraLongAnswer = q.answers.some(answer => answer.text.length > 50);

          let answersText = '';
          if (answersWithCodeOrEquation || answersWithExtraLongAnswer) {
            answersText = q.answers.map((a, aIndex) => {
              return `${String.fromCharCode(65 + aIndex)}. ${a.text}\n` +
                (a.code ? `\`\`\`\n${a.code}\n\`\`\`\n` : '') +
                (a.equation ? `$$${a.equation}$$\n` : '');
            }).join('\n');
          } else {
            const columnWidth = Math.ceil(q.answers.length / 2);
            for (let i = 0; i < columnWidth; i++) {
              const answer1 = q.answers[i];
              const answer2 = q.answers[i + columnWidth];
              answersText += `${String.fromCharCode(65 + i)}. ${answer1.text}  `;
              if (answer2) {
                answersText += `${String.fromCharCode(65 + i + columnWidth)}. ${answer2.text}\n`;
              } else {
                answersText += '\n';
              }
            }
          }

          return questionText + answersText;
        }).join('\n')
    }).join('\n---\n\n');

    navigator.clipboard.writeText(text);
  }
  
  return (
    <div className="min-h-screen bg-background w-full">
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full flex justify-between items-center px-4 py-4">
        <h1 className="text-2xl font-bold">Test Generator</h1>
        <TestMenu
          onPrint={handlePrint}
          onExportPDF={handleExportPDF}
          onExportMarkdown={handleExportText}
          onCopyToClipboard={handleCopyToClipboard}
          onScrambleOptions={() => setScrambleDialogOpen(true)}
          onViewSaved={() => setSavedQuestionsOpen(true)}
        />
      </div>

      <main className="container py-8 space-y-8 w-full">
          <ScrambleDialog
        open={scrambleDialogOpen}
        onOpenChange={setScrambleDialogOpen}
        numVersions={numVersions}
        setNumVersions={setNumVersions}
        scrambleQuestions={scrambleQuestions}
        setScrambleQuestions={setScrambleQuestions}
        scrambleAnswers={scrambleAnswers}
        setScrambleAnswers={setScrambleAnswers}
        onGenerate={() => {
          generateVersions(
            parseInt(numVersions),
            scrambleQuestions,
            scrambleAnswers
          )
          setScrambleDialogOpen(false)
        }}
          />

        {editingQuestion === null ? (
          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
              <TabsTrigger value="versions">Versions ({versions.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="questions" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {questions.map((question, questionIndex) => (
                  <Card key={question.id} className="flex flex-col">
                    <CardContent className="flex-1 p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1 flex-1">
                            <h3 className="font-medium">{question.text}</h3>
                            {question.code && (
                              <pre className="bg-muted p-2 rounded-md text-sm overflow-x-auto">
                                {question.code}
                              </pre>
                            )}
                            {question.equation && (
                                <div className={`bg-muted p-2 rounded-md text-sm overflow-x-auto question-${questionIndex}`}>
                                <span
                                  dangerouslySetInnerHTML={{
                                  __html: katex.renderToString(question.equation, {
                                    throwOnError: false,
                                    displayMode: true,
                                    output: 'html'
                                  })
                                  }}
                                />
                                </div>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingQuestion(question)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteQuestion(question.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          {question.answers.map((answer) => (
                          <div
                            key={answer.id}
                            className={`p-2 rounded-md ${
                            answer.isCorrect 
                              ? "bg-green-100 dark:bg-green-900/30" 
                              : "bg-muted"
                            }`}
                          >
                            {answer.text}
                            {answer.code && (
                            <pre className="bg-muted p-2 rounded-md text-sm overflow-x-auto mt-2">
                              {answer.code}
                            </pre>
                            )}
                            {answer.equation && (
                            <div className="bg-muted p-2 rounded-md text-sm overflow-x-auto mt-2">
                              <span
                              dangerouslySetInnerHTML={{
                                __html: katex.renderToString(answer.equation, {
                                throwOnError: false,
                                displayMode: true,
                                }),
                              }}
                              />
                            </div>
                            )}
                          </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

                <div className="flex justify-center gap-4">
                <Button onClick={() => {
                  setEditingQuestion({} as Question)
                  setAddingQuestion(true)
                }}>
                Add Question
                </Button>
                <Button variant="outline" onClick={clearAllData}>
                Clear All
                </Button>
                <Button variant="outline" onClick={() => document.getElementById('fileInput')?.click()}>
                Import Questions
                </Button>
                <input
                type="file"
                id="fileInput"
                accept=".txt"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                      const text = await file.text();
                      const parseQuestionsFromText = (text: string): Question[] => {
                          const lines = text.split('\n').filter(line => line.trim() !== '');
                          const questions: Question[] = [];
                          let currentQuestion: Question | null = null;
                          let currentAnswers: { text: string; code?: string; equation?: string; isCorrect: boolean }[] = [];
                          let insideCodeBlock = false;
                          let insideEquationBlock = false;
                          let isQuestionCodeBlock = false;
                          let isQuestionEquationBlock = false;
              
                          const saveCurrentQuestion = () => {
                              if (currentQuestion) {
                                  currentQuestion.answers = currentAnswers.map(answer => ({
                                      ...answer,
                                      id: Math.random().toString(36).substr(2, 9)
                                  }));
                                  questions.push(currentQuestion);
                              }
                          };
              
                          lines.forEach(line => {
                              const trimmedLine = line.trim();
              
                              if (insideCodeBlock) {
                                  if (trimmedLine.startsWith('```')) {
                                      insideCodeBlock = false;
                                  } else {
                                      if (isQuestionCodeBlock && currentQuestion) {
                                          currentQuestion.code += '\n' + line;
                                      } else if (currentAnswers.length > 0) {
                                          currentAnswers[currentAnswers.length - 1].code += '\n' + line;
                                      }
                                  }
                                  return;
                              }
              
                              if (insideEquationBlock) {
                                  if (trimmedLine.startsWith('$$')) {
                                      insideEquationBlock = false;
                                  } else {
                                      if (isQuestionEquationBlock && currentQuestion) {
                                          currentQuestion.equation += '\n' + trimmedLine;
                                      } else if (currentAnswers.length > 0) {
                                          currentAnswers[currentAnswers.length - 1].equation += '\n' + trimmedLine;
                                      }
                                  }
                                  return;
                              }
              
                              if (/^\d+\./.test(trimmedLine) || !currentQuestion) {
                                  saveCurrentQuestion();
                                  currentQuestion = {
                                      id: Math.random().toString(36).substr(2, 9),
                                      text: trimmedLine.replace(/^\d+\.\s*/, ''),
                                      answers: []
                                  };
                                  currentAnswers = [];
                                  isQuestionCodeBlock = false;
                                  isQuestionEquationBlock = false;
                              } else if (/^\*?[A-Z]\./.test(trimmedLine)) {
                                  const isCorrect = trimmedLine.startsWith('*');
                                  const answerText = trimmedLine.replace(/^\*?[A-Z]\.\s*/, '');
                                  currentAnswers.push({
                                      text: answerText,
                                      isCorrect
                                  });
                              } else if (trimmedLine.startsWith('```')) {
                                  insideCodeBlock = true;
                                  if (currentAnswers.length > 0) {
                                      currentAnswers[currentAnswers.length - 1].code = '';
                                  } else if (currentQuestion) {
                                      currentQuestion.code = '';
                                      isQuestionCodeBlock = true;
                                  }
                              } else if (trimmedLine.startsWith('$$')) {
                                  insideEquationBlock = true;
                                  if (currentAnswers.length > 0) {
                                      currentAnswers[currentAnswers.length - 1].equation = '';
                                  } else if (currentQuestion) {
                                      currentQuestion.equation = '';
                                      isQuestionEquationBlock = true;
                                  }
                              } else {
                                  if (currentAnswers.length > 0) {
                                      currentAnswers[currentAnswers.length - 1].text += ' ' + trimmedLine;
                                  } else if (currentQuestion) {
                                      currentQuestion.text += ' ' + trimmedLine;
                                  }
                              }
                          });
              
                          saveCurrentQuestion();
              
                          return questions;
                      };
              
                      const importedQuestions = parseQuestionsFromText(text);
                      const dialog = document.createElement('div');
                      dialog.style.position = 'fixed';
                      dialog.style.top = '50%';
                      dialog.style.left = '50%';
                      dialog.style.transform = 'translate(-50%, -50%)';
                      dialog.style.backgroundColor = 'white';
                      dialog.style.padding = '20px';
                      dialog.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                      dialog.style.zIndex = '1000';
              
                      const message = document.createElement('p');
                      message.textContent = 'Would you like to replace the existing questions or add the new ones?';
                      dialog.appendChild(message);
              
                      const buttonContainer = document.createElement('div');
                      buttonContainer.style.display = 'flex';
                      buttonContainer.style.justifyContent = 'space-between';
                      buttonContainer.style.marginTop = '20px';
              
                      const replaceButton = document.createElement('button');
                      replaceButton.textContent = 'Replace';
                      replaceButton.style.marginRight = '10px';
                      replaceButton.onclick = () => {
                          clearAllData();
                          importedQuestions.forEach(addQuestion);
                          document.body.removeChild(dialog);
                      };
              
                      const addButton = document.createElement('button');
                      addButton.textContent = 'Add';
                      addButton.style.marginRight = '10px';
                      addButton.onclick = () => {
                          importedQuestions.forEach(addQuestion);
                          document.body.removeChild(dialog);
                      };
              
                      const cancelButton = document.createElement('button');
                      cancelButton.textContent = 'Cancel';
                      cancelButton.onclick = () => {
                          return document.body.removeChild(dialog);
                      };
                  
              
                  buttonContainer.appendChild(replaceButton);
                  buttonContainer.appendChild(addButton);
                  buttonContainer.appendChild(cancelButton);
                  dialog.appendChild(buttonContainer);

                  document.body.appendChild(dialog);
                  }
                }}
                />
                </div>


              
            </TabsContent>
            <TabsContent value="versions" className="space-y-8">
              {versions.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2">
                  {versions.map((version) => (
                    <Card key={version.id} className="print:shadow-none">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-4">
                          Test {version.id}
                        </h3>
                        <div className="space-y-6">
                          {version.questions.map((question, index) => (
                            <div key={question.id} className="space-y-4">
                              <div className="space-y-2">
                                <h4 className="font-medium">
                                  {index + 1}. {question.text}
                                </h4>
                                {question.code && (
                                  <pre className="bg-muted p-2 rounded-md text-sm overflow-x-auto">
                                    {question.code}
                                  </pre>
                                )}
                              </div>
                              <div className="grid gap-2">
                                {question.answers.map((answer, aIndex) => (
                                  <div
                                    key={answer.id}
                                    className="p-2 rounded-md bg-muted"
                                  >
                                    {String.fromCharCode(65 + aIndex)}. {answer.text}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No versions generated yet. Use the menu to generate test versions.
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <QuestionEditor
            question={editingQuestion}
            onSave={handleSaveQuestion}
            onCancel={() => {
              setEditingQuestion(null)
              setAddingQuestion(false);
            }}
          />
        )}
      </main>

      <SavedQuestionsDialog
        open={savedQuestionsOpen}
        onOpenChange={setSavedQuestionsOpen}
        questions={questions}
        onEdit={(question) => {
          setEditingQuestion(question);
          setSavedQuestionsOpen(false);
        }}
        onDelete={(questionId) => {
          deleteQuestion(questionId);
        }}
      />

      {/* Hidden iframe for printing */}
      <iframe
        ref={printFrameRef}
        className="hidden"
        title="Print Frame"
      />
    </div>
  )
}
