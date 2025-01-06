import { Question } from '../types/test'

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function generateTestVersion(
  questions: Question[],
  scrambleQuestions: boolean,
  scrambleAnswers: boolean
): Question[] {
  let newQuestions = [...questions];
  
  if (scrambleQuestions) {
    newQuestions = shuffleArray(newQuestions);
  }
  
  if (scrambleAnswers) {
    newQuestions = newQuestions.map(question => ({
      ...question,
      answers: shuffleArray(question.answers)
    }));
  }
  
  return newQuestions;
}

