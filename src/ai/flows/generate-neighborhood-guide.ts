'use server';
/**
 * @fileOverview AI flow to generate neighborhood "vibe" guides for tenants.
 *
 * - generateNeighborhoodGuide - A function that handles the AI generation process.
 * - NeighborhoodInput - The input type for the function.
 * - NeighborhoodOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NeighborhoodInputSchema = z.object({
  location: z.string().describe('The name of the neighborhood in Cross River State.'),
});
export type NeighborhoodInput = z.infer<typeof NeighborhoodInputSchema>;

const NeighborhoodOutputSchema = z.object({
  vibe: z.string().describe('A short, catchy description of the neighborhood vibe.'),
  bestFor: z.array(z.string()).describe('List of groups this area is best for (e.g., students, families, business professionals).'),
  highlights: z.string().describe('Key landmarks, proximity to hubs, or lifestyle features of the area.'),
});
export type NeighborhoodOutput = z.infer<typeof NeighborhoodOutputSchema>;

/**
 * Wrapper function to call the neighborhood guide generation flow.
 */
export async function generateNeighborhoodGuide(input: NeighborhoodInput): Promise<NeighborhoodOutput> {
  return generateNeighborhoodGuideFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNeighborhoodGuidePrompt',
  input: { schema: NeighborhoodInputSchema },
  output: { schema: NeighborhoodOutputSchema },
  prompt: `You are a local expert in Cross River State, Nigeria, specializing in real estate and urban lifestyle. 
  
  Generate an authentic, helpful "Vibe Check" for the neighborhood: {{{location}}}.
  
  The guide should feel like it's coming from a knowledgeable local friend. Highlight:
  1. The general atmosphere (e.g., quiet residential, bustling commercial, student-centric).
  2. Proximity to major Cross River landmarks (e.g., UNICAL, Calabar Port, MCC Road, Tinapa, or the Obudu Ranch).
  3. Why someone would love living here.
  
  Keep the vibe description engaging and under 100 words. Return the output in the specified JSON format.`,
});

const generateNeighborhoodGuideFlow = ai.defineFlow(
  {
    name: 'generateNeighborhoodGuideFlow',
    inputSchema: NeighborhoodInputSchema,
    outputSchema: NeighborhoodOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate neighborhood guide. Please try again.');
    }
    return output;
  }
);
