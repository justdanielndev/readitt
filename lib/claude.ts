import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
const STORY_GENERATION_PROMPT = `You are an AI creative writer specializing in crafting engaging chapters for online story platforms like Wattpad, AO3 (Archive of Our Own), or Webtoon. Your task is to write a chapter based on the following story elements:
<story_name>{{STORY_NAME}}</story_name>
<fandom>{{FANDOM}}</fandom>
<characters>{{CHARACTERS}}</characters>
<topics>{{TOPICS}}</topics>
<theme>{{THEME}}</theme>
<content_warnings>{{CONTENT_WARNINGS}}</content_warnings>
<age_rating>{{AGE_RATING}}</age_rating>
Begin by researching the necessary background information. In your thinking block, wrap this work in <background_research> tags:
1. If a fandom is specified, search for details about that fandom, including:
   - List of key characters and their traits
   - Important settings and their descriptions
   - 5-7 crucial plot points or conventions
2. If no fandom is specified, or in addition to fandom research, search for information related to the characters, topics, or theme provided to enrich your writing.
3. List key findings that will inform your writing.
4. Each search query should be for 1 item, not more.
Next, proceed with the following steps:
1. Story Planning (First Chapter Only):
In your thinking block, wrap this work in <story_arc_planning> tags:
If this is the first chapter, outline the overall story arc:
a) List 5-7 main plot points that will drive the story forward
b) For each main character, note 3-4 key development milestones
c) Brainstorm 3-5 potential plot twists or significant changes
d) Propose 3-4 possible ending ideas
e) For each given topic and theme, list 3-4 unique ways to incorporate them into the story
f) Identify 2-3 overarching conflicts or challenges for the characters
g) Create a character relationship map, showing connections and potential conflicts
Ensure that your ideas are creative, unique, and cohesive. Focus on elements that will make the story stand out while maintaining internal consistency.
2. Chapter Planning:
In your thinking block, wrap this work in <chapter_structure> tags:
Plan your chapter using this process:
a) List 7-10 potential scene ideas, incorporating elements from your fandom research if applicable
b) For each scene idea, rate its potential for:
   - Advancing the plot (1-5 scale)
   - Developing characters (1-5 scale)
   - Incorporating unique elements (1-5 scale)
c) Select the top 4-5 scenes based on your ratings
d) Outline the chapter structure, varying it from the typical format:
   - Consider unconventional opening scenes
   - Plan 3-4 development scenes with varying pacing
   - Design an unexpected closing hook
e) For each scene, note:
   - Key character interactions
   - Dialogue points, considering each character's unique voice
   - Internal thoughts and motivations
f) List 5-7 descriptive elements to set the scene and mood, focusing on sensory details
g) Create a scene-by-scene emotional arc, noting the intended reader response for each
Aim for a balance between familiarity and innovation in your chapter structure.
3. Writing the Chapter:
In your thinking block, wrap this work in <writing_preparation> tags:
Prepare to write the chapter following these guidelines:
- Use clear, accessible language appropriate for the target audience and age rating
- Include vivid, sensory descriptions to immerse readers in the scene
- Balance dialogue, action, and internal monologue to maintain engagement
- Ensure each character has a distinct voice and personality
- Naturally weave the given topics into your narrative
- Maintain the specified theme throughout, using it to guide the overall tone
- Avoid repetition and clichés
- Aim for a writing style that feels organic and character-driven, not AI-generated
- List 2-3 unique metaphors or similes for each scene to enhance descriptions
- You can use Markdown formatting
- When writing a new line, use <newline/> to indicate a line break
- Use <paragraph/> tags to indicate a new paragraph
CONTENT GUIDELINES:
- You may ONLY include content that matches the specified content warnings
- The content warnings provided are: {{CONTENT_WARNINGS}}
- The age rating is: {{AGE_RATING}}
- If no content warnings are specified, write content appropriate for "all-ages"
- Do NOT include any NSFW, sexual, violent, or mature content unless explicitly allowed by the content warnings
- All content must be appropriate for the specified age rating
- If content warnings include specific elements (violence, sexual content, etc.), you may include those elements responsibly and appropriately for the age rating
- Content warnings ensure transparency with readers - only write what is disclosed
For the first chapter:
- Begin with a compelling, unexpected opening that introduces the main character(s) and sets the scene
- Establish the central conflict or goal that will drive the story forward
For subsequent chapters:
- Ensure continuity with previous chapters while advancing the plot
- Introduce new elements or complications to keep the story fresh
As you write, periodically pause to review your work and ensure you're maintaining character consistency and advancing the plot effectively, not repeating, being unique...
4. Word Count and Revision:
In your thinking block, wrap this work in <chapter_revision> tags:
After writing the chapter:
a) Count the words to ensure it meets the 1000-2000 word requirement
b) If too short:
   - Identify 3-4 areas where you can expand description, dialogue, or internal monologue
   - Add these expansions, ensuring they enhance the story rather than just pad the word count
c) If too long:
   - Identify 3-4 sections that can be trimmed without losing essential content
   - Make cuts, focusing on tightening prose and removing redundancies
d) Review the chapter for:
   - Character consistency
   - Plot advancement
   - Thematic relevance
   - Engaging hooks and pacing
   - Consistent pacing throughout the chapter
e) Make final adjustments to improve flow and impact
5. Plan image prompt for story cover (if first chapter):
In your thinking block, wrap this work in <image_prompt> tags:
If this is the first chapter, create a detailed AI image prompt for the story cover:
- Use the story title, fandom, and key themes to generate a visually striking prompt (no text shown in the image)
- Ensure the prompt is suitable for generating a horizontal book cover image
- Focus on creating a cover that will attract new readers and reflect the story's essence
- Do NOT include any references to children, minors, or kids (censored content)
- Do NOT include people in the image, as the AI model does not generate faces well
- The prompt should be detailed, marketable, and visually appealing
- Include elements that reflect the story's themes, characters, and setting
- Use descriptive language to evoke a cinematic and atmospheric feel
- Include the image's style (e.g., digital art, illustration) and quality (e.g., high resolution, professional book cover style)
6. Plan story data (if first chapter):
In your thinking block, wrap this work in <story_data> tags:
If this is the first chapter, prepare the story data in JSON format:
{
  "characters": "{{CHARACTERS}}",
  "topics": "{{TOPICS}}",
  "themes": "{{THEMES}}",
  "description": "{{DESCRIPTION}}"
}
- If the user gives you characters, topics, or themes, include them in the JSON properly formatting them and writing them (if they added for example character descriptions, as you have already written them down, don't repeat them, just use the names)
- You can add any extra information you think is relevant or you invented/created during the writing process
- This data will be used to help readers understand the story's context and themes
Ensure your final product is polished, engaging, and true to the characters and world you've created.
Format your output as follows:
<chapter>
[Chapter title]
[Your chapter content here, formatted with appropriate paragraphs, dialogue, and scene breaks]
</chapter>
<image_prompt>
[Image prompt for story cover, if first chapter]
</image_prompt>
<story_data> (only if first chapter)
{
  "characters": "{{CHARACTERS}}",
  "topics": "{{TOPICS}}",
  "themes": "{{THEMES}}",
  "description": "{{DESCRIPTION}}"
}
(only if first chapter)
</story_data>
Example output structure (generic, without content):
<chapter>
Chapter X: [Intriguing Title]
[Opening paragraph with an unexpected or gripping start]
[Character introduction or reintroduction, showcasing unique voices]
[Plot development through action, dialogue, or internal monologue]
[Vivid scene description, engaging multiple senses]
[Character interactions, revealing personalities and relationships]
[Rising tension or conflict introduction]
[Further plot advancement and character development]
[Closing paragraph with a compelling hook or emotional punch]
</chapter>
<image_prompt>
[Image prompt for story cover, if applicable]
</image_prompt>
<story_data> (only if first chapter)
{
  "characters": "{{CHARACTERS}}",
  "topics": "{{TOPICS}}",
  "themes": "{{THEMES}}",
  "description": "{{DESCRIPTION}}"
}
(only if first chapter)
</story_data>
Remember, your goal is to create an engaging, well-written chapter that incorporates the given story elements while avoiding repetition and maintaining a style appropriate for platforms like Wattpad. Focus on crafting a narrative that will keep readers invested in the story and characters, using unique ideas that work cohesively within the overall plot.
Your final output should consist only of the chapter content within the <chapter> tags, image prompt within the <image_prompt> tags (only if first chapter) and <story_data> (only if first chapter) and should not include any of the planning work you did in the thinking blocks.`;
export async function generateStoryWithHistory(
  storyName: string,
  fandom: string,
  characters: string = '',
  topics: string = '',
  theme: string = '',
  contentWarnings: string[] = [],
  ageRating: string = 'all-ages',
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  progressCallback?: (progress: number) => void,
  customPrompt?: string
): Promise<{
  content: string;
  title: string;
  fullResponse: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  imagePrompt?: string | null;
  storyData?: {
    characters: string;
    topics: string;
    themes: string;
    description: string;
  } | null;
}> {
  try {
    console.log('🔧 [CLAUDE] Received parameters:');
    console.log('  - contentWarnings (raw):', contentWarnings);
    console.log('  - contentWarnings type:', typeof contentWarnings);
    console.log('  - contentWarnings array check:', Array.isArray(contentWarnings));
    console.log('  - contentWarnings length:', contentWarnings?.length);
    console.log('  - ageRating (raw):', ageRating);
    console.log('  - ageRating type:', typeof ageRating);
    const contentWarningsText = contentWarnings.length > 0 
      ? contentWarnings.join(', ') 
      : 'None (all-ages content)';
    console.log('🔧 Filling Claude prompt with:');
    console.log('  - Content warnings:', contentWarningsText);
    console.log('  - Age rating:', ageRating);
    const filledPrompt = STORY_GENERATION_PROMPT
      .replace(/{{STORY_NAME}}/g, storyName || '')
      .replace(/{{FANDOM}}/g, fandom || '')
      .replace(/{{CHARACTERS}}/g, characters || '')
      .replace(/{{TOPICS}}/g, topics || '')
      .replace(/{{THEME}}/g, theme || '')
      .replace(/{{CONTENT_WARNINGS}}/g, contentWarningsText)
      .replace(/{{AGE_RATING}}/g, ageRating || 'all-ages');
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (conversationHistory.length > 0) {
      messages.push(...conversationHistory);
      if (customPrompt) {
        messages.push({
          role: 'user',
          content: customPrompt
        });
      }
    } else {
      messages.push({
        role: 'user',
        content: customPrompt || filledPrompt
      });
    }
    console.log('Conversation being sent to Claude:', JSON.stringify(messages, null, 2));
    const stream = await anthropic.beta.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 20000,
      temperature: 1,
      messages: messages as any,
      tools: [
        {
          name: 'web_search',
          type: 'web_search_20250305'
        }
      ],
      betas: ['web-search-2025-03-05'],
      stream: true
    });
    let fullResponse = '';
    let progress = 0;
    const progressSteps = conversationHistory.length === 0 
      ? ['story_arc_planning', 'chapter_structure', 'chapter']
      : ['chapter_structure', 'chapter']; 
    let foundSteps = new Set<string>();
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullResponse += chunk.delta.text;
        for (const step of progressSteps) {
          if (!foundSteps.has(step) && fullResponse.includes(`<${step}>`)) {
            foundSteps.add(step);
            progress = Math.min(foundSteps.size / progressSteps.length * 100, 100);
            progressCallback?.(progress);
          }
        }
      }
    }
    if (progress < 100) {
      progressCallback?.(100);
    }
    const chapterMatch = fullResponse.match(/<chapter>([\s\S]*?)<\/chapter>/);
    if (!chapterMatch) {
      throw new Error('No chapter content found in response');
    }
    const chapterContent = chapterMatch[1].trim();
    const lines = chapterContent.split('\n');
    const title = lines[0]
      .replace(/^Chapter \d+:\s*/, '') 
      .replace(/^#+\s*/, '') 
      .replace(/\*\*(.*?)\*\*/g, '$1') 
      .replace(/\*(.*?)\*/g, '$1') 
      .replace(/`(.*?)`/g, '$1') 
      .trim();
    const content = lines.slice(2).join('\n').trim(); 
    const imagePromptMatch = fullResponse.match(/<image_prompt>([\s\S]*?)<\/image_prompt>/);
    const imagePrompt = imagePromptMatch ? imagePromptMatch[1].trim() : null;
    const storyDataMatch = fullResponse.match(/<story_data>([\s\S]*?)<\/story_data>/);
    let storyData = null;
    if (storyDataMatch) {
      try {
        const jsonString = storyDataMatch[1].trim();
        storyData = JSON.parse(jsonString);
      } catch (error) {
        console.error('Error parsing story data JSON:', error);
        storyData = null;
      }
    }
    const updatedHistory = [
      ...messages,
      { role: 'assistant' as const, content: fullResponse }
    ];
    return {
      content,
      title,
      fullResponse,
      conversationHistory: updatedHistory,
      imagePrompt,
      storyData
    };
  } catch (error) {
    console.error('Error generating story:', error);
    throw new Error('Failed to generate story');
  }
}
export async function continueStory(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  userFeedback: string,
  chapterNumber: number,
  progressCallback?: (progress: number) => void
): Promise<{
  content: string;
  title: string;
  fullResponse: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  imagePrompt?: string | null;
  storyData?: {
    characters: string;
    topics: string;
    themes: string;
    description: string;
  } | null;
}> {
  try {
    const continueMessage = `${userFeedback}\n\nContinue with ch. ${chapterNumber}.`;
    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: continueMessage }
    ];
    console.log('Continue story conversation being sent to Claude:', JSON.stringify(messages, null, 2));
    const stream = await anthropic.beta.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 20000,
      temperature: 1,
      messages: messages as any,
      tools: [
        {
          name: 'web_search',
          type: 'web_search_20250305'
        }
      ],
      betas: ['web-search-2025-03-05'],
      stream: true
    });
    let fullResponse = '';
    let progress = 0;
    const progressSteps = ['chapter_structure', 'chapter'];
    let foundSteps = new Set<string>();
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullResponse += chunk.delta.text;
        for (const step of progressSteps) {
          if (!foundSteps.has(step) && fullResponse.includes(`<${step}>`)) {
            foundSteps.add(step);
            progress = Math.min(foundSteps.size / progressSteps.length * 100, 100);
            progressCallback?.(progress);
          }
        }
      }
    }
    if (progress < 100) {
      progressCallback?.(100);
    }
    const chapterMatch = fullResponse.match(/<chapter>([\s\S]*?)<\/chapter>/);
    if (!chapterMatch) {
      throw new Error('No chapter content found in response');
    }
    const chapterContent = chapterMatch[1].trim();
    const lines = chapterContent.split('\n');
    const title = lines[0]
      .replace(/^Chapter \d+:\s*/, '') 
      .replace(/^#+\s*/, '') 
      .replace(/\*\*(.*?)\*\*/g, '$1') 
      .replace(/\*(.*?)\*/g, '$1') 
      .replace(/`(.*?)`/g, '$1') 
      .trim();
    const content = lines.slice(2).join('\n').trim(); 
    const imagePromptMatch = fullResponse.match(/<image_prompt>([\s\S]*?)<\/image_prompt>/);
    const imagePrompt = imagePromptMatch ? imagePromptMatch[1].trim() : null;
    const storyDataMatch = fullResponse.match(/<story_data>([\s\S]*?)<\/story_data>/);
    let storyData = null;
    if (storyDataMatch) {
      try {
        const jsonString = storyDataMatch[1].trim();
        storyData = JSON.parse(jsonString);
      } catch (error) {
        console.error('Error parsing story data JSON:', error);
        storyData = null;
      }
    }
    const updatedHistory = [
      ...messages,
      { role: 'assistant' as const, content: fullResponse }
    ];
    return {
      content,
      title,
      fullResponse,
      conversationHistory: updatedHistory,
      imagePrompt,
      storyData
    };
  } catch (error) {
    console.error('Error continuing story:', error);
    throw new Error('Failed to continue story');
  }
}