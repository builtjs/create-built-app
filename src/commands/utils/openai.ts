import OpenAI from 'openai';
import { getProjectEnv } from './project-env';
import { createComponentPrompt } from './prompts';
import { generateTemplateId } from './id.js';
import { TemplateMetadata } from '../../types';
import { Section } from '../../interfaces';
import { toCamelCase } from './formatting.js';

export async function createOpenAIClient(projectRoot: string): Promise<OpenAI> {
  const { apiKey } = await getProjectEnv(projectRoot);
  return new OpenAI({ apiKey });
}

export async function generateComponent(
  openai: OpenAI, 
  projectRoot: string,
  section: Section, 
  customPrompt?: string,
  designSystem: 'basic' | 'shadcn' = 'basic'
): Promise<TemplateMetadata> {
  const { model } = await getProjectEnv(projectRoot);
  
  const baseName = toCamelCase(section.name);
  const fullName = generateTemplateId(baseName);
  
  const prompt = createComponentPrompt(section, fullName, customPrompt, designSystem);

  const completion = await openai.chat.completions.create({
    model,
    messages: [{ 
      role: "user", 
      content: prompt 
    }],
    temperature: 0.7,
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      throw new Error('No JSON block found in response');
    }

    const jsonStr = jsonMatch[1].trim();
    const result = JSON.parse(jsonStr);

    if (!result.metadata?.category || !result.code) {
      throw new Error('Invalid response structure');
    }

    // Use our pre-generated name instead of the one from OpenAI
    return {
      ...result.metadata,
      name: fullName,
      code: result.code
    };
  } catch (error) {
    console.error('Parse Error:', error);
    console.error('Raw Response:', content);
    throw new Error('Failed to parse OpenAI response');
  }
}