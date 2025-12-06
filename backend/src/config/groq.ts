import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export const MODEL = 'llama3-70b-8192';

export default groq;



