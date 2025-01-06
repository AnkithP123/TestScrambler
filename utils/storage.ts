import { Question, TestVersion } from '../types/test';

const STORAGE_KEY = 'test-generator-data-v2'; // Versioned key

interface StorageData {
  questions: Question[];
  versions: TestVersion[];
  lastUpdated: number;
}

export function saveToStorage(data: Partial<StorageData>) {
  try {
    console.log('Saving to storage:', data);
    const existing = loadFromStorage();
    const newData = {
      ...existing,
      ...data,
      lastUpdated: Date.now(),
    };
    console.log('Final data to save:', newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    return true;
  } catch (error) {
    console.error('Error saving to storage:', error);
    return false;
  }
}

export function loadFromStorage(): StorageData {
  try {
    console.log('Loading from storage...');
    const data = localStorage.getItem(STORAGE_KEY);
    console.log('Raw data from storage:', data);
    
    if (!data) {
      console.log('No data found, returning empty state');
      return { questions: [], versions: [], lastUpdated: Date.now() };
    }
    
    const parsed = JSON.parse(data);
    console.log('Parsed data:', parsed);
    
    // Validate data structure
    if (!Array.isArray(parsed.questions) || !Array.isArray(parsed.versions)) {
      console.error('Invalid data structure:', parsed);
      throw new Error('Invalid data structure');
    }
    
    return parsed;
  } catch (error) {
    console.error('Error loading from storage:', error);
    return { questions: [], versions: [], lastUpdated: Date.now() };
  }
}

