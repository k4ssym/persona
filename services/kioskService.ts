import { MOCK_RESPONSES } from '../constants';

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getRandomResponse = () => {
  return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
};