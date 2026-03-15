'use server';
/**
 * @fileOverview AI flow to generate professional property descriptions for landlords.
 *
 * - generateListingDescription - A function that handles the AI generation process.
 * - GenerateDescriptionInput - The input type for the function.
 * - GenerateDescriptionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateDescriptionInputSchema = z.object({
  title: z.string().describe('The working title of the property.'),
  type: z.string().describe('The type of property (e.g., Flat, Duplex).'),
  beds: z.number().describe('Number of bedrooms.'),
  baths: z.number().describe('Number of bathrooms.'),
  location: z.string().describe('The location of the property.'),
  keyFeatures: z.string().optional().describe('Optional brief notes or amenities to include.'),
});
export type GenerateDescriptionInput = z.infer<typeof GenerateDescriptionInputSchema>;

const GenerateDescriptionOutputSchema = z.object({
  description: z.string().describe('The professionally written property description.'),
});
export type GenerateDescriptionOutput = z.infer<typeof GenerateDescriptionOutputSchema>;

/**
 * Wrapper function to call the listing description generation flow.
 */
export async function generateListingDescription(input: GenerateDescriptionInput): Promise<GenerateDescriptionOutput> {
  return generateListingDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateListingDescriptionPrompt',
  input: { schema: GenerateDescriptionInputSchema },
  output: { schema: GenerateDescriptionOutputSchema },
  prompt: `You are an expert real estate copywriter specializing in the Nigerian property market (Lagos, Abuja, Port Harcourt, etc.).
  
  Generate a catchy, professional, and detailed property description for a rental listing based on the following details:
  
  Title: {{{title}}}
  Property Type: {{{type}}}
  Bedrooms: {{{beds}}}
  Bathrooms: {{{baths}}}
  Location: {{{location}}}
  Key Features/Notes: {{{keyFeatures}}}
  
  The description should be inviting, highlight the lifestyle benefits of the location, and use persuasive language suitable for the RentaFast platform. Ensure it sounds premium but authentic to the local context. Keep it under 200 words.`,
});

const generateListingDescriptionFlow = ai.defineFlow(
  {
    name: 'generateListingDescriptionFlow',
    inputSchema: GenerateDescriptionInputSchema,
    outputSchema: GenerateDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate a description. Please try again.');
    }
    return output;
  }
);
