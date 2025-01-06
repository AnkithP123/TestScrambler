import { useState, useEffect, useCallback } from 'react';
import { Question, TestVersion } from '../types/test';
import { generateTestVersion } from '../utils/scramble';
import { saveToStorage, loadFromStorage } from '../utils/storage';

export function useTestGenerator() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [versions, setVersions] = useState<TestVersion[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load data on mount
  useEffect(() => {
    console.log('Initial load effect running');
    const data = loadFromStorage();
    console.log('Loaded data:', data);
    setQuestions(data.questions);
    setVersions(data.versions);
    setInitialized(true);
  }, []);

  // Save questions when they change
  useEffect(() => {
    console.log('Questions changed effect:', questions);
    if (initialized) {
      console.log('Saving questions:', questions);
      saveToStorage({ questions });
    }
  }, [questions, initialized]);

  // Save versions when they change
  useEffect(() => {
    console.log('Versions changed effect:', versions);
    if (initialized) {
      console.log('Saving versions:', versions);
      saveToStorage({ versions });
    }
  }, [versions, initialized]);

  const addQuestion = useCallback((question: Question) => {
    console.log('Adding question:', question);
    setQuestions(prev => {
      const newQuestions = [...prev, question];
      console.log('New questions state:', newQuestions);
      return newQuestions;
    });
  }, []);

  const updateQuestion = useCallback((questionId: string, updatedQuestion: Question) => {
    console.log('Updating question:', questionId, updatedQuestion);
    setQuestions(prev => {
      const newQuestions = prev.map(q => (q.id === questionId ? updatedQuestion : q));
      console.log('New questions state after update:', newQuestions);
      return newQuestions;
    });
  }, []);

  const deleteQuestion = useCallback((questionId: string) => {
    console.log('Deleting question:', questionId);
    setQuestions(prev => {
      const newQuestions = prev.filter(q => q.id !== questionId);
      console.log('New questions state after delete:', newQuestions);
      return newQuestions;
    });
  }, []);

  const generateVersions = useCallback((
    numVersions: number,
    scrambleQuestions: boolean,
    scrambleAnswers: boolean
  ) => {
    console.log('Generating versions:', { numVersions, scrambleQuestions, scrambleAnswers });
    console.log('Current questions:', questions);
    const newVersions = Array.from({ length: numVersions }, (_, i) => ({
      id: `version-${i + 1}`,
      title: `Version ${i + 1}`,
      questions: generateTestVersion(questions, scrambleQuestions, scrambleAnswers)
    }));
    console.log('Generated versions:', newVersions);
    setVersions(newVersions);
  }, [questions]);

  return {
    questions,
    versions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    generateVersions,
    clearAllData: () => setQuestions([]),
    initialized
  };
}

