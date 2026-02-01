'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing mess hall data and providing insights to mess staff.
 *
 * The flow takes historical food consumption data and daily prepared/consumed quantities as input,
 * analyzes the data using the Gemini API, and returns an overview of student food preferences
 * to minimize food wastage.
 *
 * - `getMessOverviewInsights` - The main function to trigger the analysis flow.
 * - `MessOverviewInput` - The input type for the `getMessOverviewInsights` function.
 * - `MessOverviewOutput` - The output type for the `getMessOverviewInsights` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MessOverviewInputSchema = z.object({
  historicalData: z
    .string()
    .describe(
      'Historical data of food consumption, including items, dates, and consumption quantities.'
    ),
  dailyPreparedData: z
    .string()
    .describe(
      'Daily data of prepared food quantities, including items, dates, and prepared quantities.'
    ),
  dailyConsumedData: z
    .string()
    .describe(
      'Daily data of consumed food quantities, including items, dates, and consumed quantities.'
    ),
});
export type MessOverviewInput = z.infer<typeof MessOverviewInputSchema>;

const MessOverviewOutputSchema = z.object({
  overview: z
    .string()
    .describe(
      'An overview of student food preferences and trends, with suggestions for minimizing food wastage.'
    ),
});
export type MessOverviewOutput = z.infer<typeof MessOverviewOutputSchema>;

export async function getMessOverviewInsights(
  input: MessOverviewInput
): Promise<MessOverviewOutput> {
  return messOverviewInsightsFlow(input);
}

const messOverviewInsightsPrompt = ai.definePrompt({
  name: 'messOverviewInsightsPrompt',
  input: {schema: MessOverviewInputSchema},
  output: {schema: MessOverviewOutputSchema},
  prompt: `You are an AI assistant helping mess staff minimize food wastage.

  Analyze the historical food consumption data, daily prepared quantities, and daily consumed quantities to identify trends in student food preferences.

  Provide an overview of these trends and suggest ways to minimize food wastage.

  Historical Data: {{{historicalData}}}
  Daily Prepared Data: {{{dailyPreparedData}}}
  Daily Consumed Data: {{{dailyConsumedData}}}
  `,
});

const messOverviewInsightsFlow = ai.defineFlow(
  {
    name: 'messOverviewInsightsFlow',
    inputSchema: MessOverviewInputSchema,
    outputSchema: MessOverviewOutputSchema,
  },
  async input => {
    const {output} = await messOverviewInsightsPrompt(input);
    return output!;
  }
);
