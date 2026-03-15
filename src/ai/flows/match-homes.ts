
'use server';
/**
 * @fileOverview AI flow to match properties with tenant preferences in Cross River.
 *
 * - matchHomes - A function that handles the matching process.
 * - MatchHomesInput - The input type for the function.
 * - MatchHomesOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PropertyMinimalSchema = z.object({
  id: z.string(),
  title: z.string(),
  location: z.string(),
  price: z.number(),
  description: z.string(),
  type: z.string(),
  beds: z.number(),
  baths: z.number(),
  amenities: z.array(z.string()),
});

const MatchHomesInputSchema = z.object({
  preferences: z.string().describe('The tenant\'s plain-English home requirements.'),
  listings: z.array(PropertyMinimalSchema).describe('The current list of available properties.'),
});
export type MatchHomesInput = z.infer<typeof MatchHomesInputSchema>;

const MatchHomesOutputSchema = z.object({
  matches: z.array(z.object({
    id: z.string().describe('The ID of the matched property.'),
    score: z.number().describe('A score from 0 to 100 indicating how well it matches.'),
    reason: z.string().describe('A short, personalized explanation of why this property fits the tenant\'s specific needs.'),
  })),
});
export type MatchHomesOutput = z.infer<typeof MatchHomesOutputSchema>;

/**
 * Wrapper function to call the home matching flow.
 */
export async function matchHomes(input: MatchHomesInput): Promise<MatchHomesOutput> {
  return matchHomesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'matchHomesPrompt',
  input: { schema: MatchHomesInputSchema },
  output: { schema: MatchHomesOutputSchema },
  prompt: `You are an AI Home Matcher for RentaFast, specialized in the Cross River State property market.
  
  Your goal is to analyze the tenant's preferences and find the best matches from the available listings.
  
  Tenant Preferences: "{{{preferences}}}"
  
  Available Listings:
  {{#each listings}}
  - ID: {{{id}}}, Title: {{{title}}}, Location: {{{location}}}, Price: ₦{{{price}}}, Description: {{{description}}}, Type: {{{type}}}, Beds: {{{beds}}}, Amenities: {{#each amenities}}{{{this}}}, {{/each}}
  {{/each}}
  
  Instructions:
  1. Score each property from 0 to 100 based on how well it fits the tenant's specific needs (location, budget, size, lifestyle).
  2. For the top matches (score > 60), provide a "reason" that speaks directly to the tenant's stated preferences. Mention specific features of the house that match their request.
  3. Be authentic to the Cross River context (e.g., if they mention being a student, prioritize areas like Etta Agbo).
  4. Return the results in the specified JSON format. Only include properties that are at least a partial match.`,
});

const matchHomesFlow = ai.defineFlow(
  {
    name: 'matchHomesFlow',
    inputSchema: MatchHomesInputSchema,
    outputSchema: MatchHomesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      return { matches: [] };
    }
    return output;
  }
);
