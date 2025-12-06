import groq, { MODEL } from '../config/groq';
import logger from '../utils/logger';

interface AgentResponse {
  trainId: number;
  trainNumber: string;
  recommendedAction: string;
  score: number;
  reasoning: Record<string, any>;
}

interface Context {
  decisionDate: string;
  totalTrains: number;
}

export async function organizeAgentResponse(
  agentResponse: AgentResponse[],
  context: Context
): Promise<string> {
  try {
    const prompt = `
You are an AI assistant explaining train induction decisions for Kochi Metro.

Agent Analysis:
${JSON.stringify(agentResponse, null, 2)}

Context:
- Decision Date: ${context.decisionDate}
- Total Trains: ${context.totalTrains}
- Requirements: 99.5% punctuality target

Generate a clear, explainable reasoning summary for each train in the following format:
1. Primary Recommendation (revenue/standby/maintenance)
2. Key Factors (list top 3-5 factors)
3. Risk Assessment (any concerns)
4. Alternative Considerations (what-if scenarios)

Use simple, clear language that supervisors can understand. Be concise but comprehensive.
`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      temperature: 0.3,
      max_tokens: 2000,
    });

    return completion.choices[0].message.content || 'Unable to generate reasoning';
  } catch (error) {
    logger.error('Error organizing agent response:', error);
    throw new Error('Failed to organize agent response');
  }
}

export async function processNaturalLanguageQuery(
  query: string,
  language: string
): Promise<any> {
  try {
    const prompt = `
Translate and process this ${language} query about train operations:
"${query}"

Determine the intent and extract parameters:
- Query type: (status_check, decision_query, conflict_check, etc.)
- Parameters: (train numbers, dates, etc.)
- Response format needed: (list, summary, detailed)

Respond in JSON format with the following structure:
{
  "intent": "query_type",
  "parameters": {},
  "responseFormat": "format_type"
}
`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response || '{}');
  } catch (error) {
    logger.error('Error processing natural language query:', error);
    throw new Error('Failed to process natural language query');
  }
}

export async function generateExplainableReasoning(
  reasoningDetails: Record<string, any>,
  trainNumber: string
): Promise<string> {
  try {
    const prompt = `
Generate a human-readable explanation for train ${trainNumber} induction decision.

Reasoning Details:
${JSON.stringify(reasoningDetails, null, 2)}

Provide a clear, concise explanation that covers:
1. Why this train was recommended for this action
2. Key factors that influenced the decision
3. Any risks or concerns
4. Confidence level

Use professional but accessible language.
`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      temperature: 0.3,
      max_tokens: 500,
    });

    return completion.choices[0].message.content || 'Unable to generate explanation';
  } catch (error) {
    logger.error('Error generating explainable reasoning:', error);
    throw new Error('Failed to generate explainable reasoning');
  }
}



