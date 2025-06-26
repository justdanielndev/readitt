import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateStoryWithHistory } from '@/lib/claude';
export async function POST(request: NextRequest) {
  try {
    const username = request.headers.get('username') || 'Anonymous Reader';
    const userId = request.headers.get('userId') || 'local-user';
    const {
      originalStoryId,
      originalChapter,
      chapterContent,
      storyName,
      description,
      tags,
      contentWarnings,
      ageRating,
      originalStory
    } = await request.json();
    if (!originalStoryId || !storyName || !description || !chapterContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    console.log('🎭 Creating one-off chapter:', {
      originalStoryId,
      storyName,
      originalChapter,
      originalStory: originalStory ? 'provided' : 'missing'
    });
    console.log('🤖 Generating one-off chapter content...');
    let conversationHistory = [];
    if (originalStory && originalStory.chapters) {
      console.log('📚 Building conversation history from', originalChapter + 1, 'chapters');
      for (let i = 0; i <= originalChapter; i++) {
        const chapter = originalStory.chapters[i];
        if (chapter) {
          conversationHistory.push({
            role: 'assistant',
            content: `<chapter>\nChapter ${i + 1}: ${chapter.title}\n\n${chapter.content}\n</chapter>`
          });
        }
      }
      console.log('✅ Built conversation history with', conversationHistory.length, 'chapters');
    } else {
      console.log('⚠️ No full story data available, using only current chapter as context');
      conversationHistory = [
        {
          role: 'assistant',
          content: `<chapter>\nChapter ${originalChapter + 1} from original story:\n\n${chapterContent}\n</chapter>`
        }
      ];
    }
    const originalContentWarnings = originalStory?.contentWarnings || [];
    const allContentWarnings = [...new Set([...originalContentWarnings, ...contentWarnings])];
    console.log('🚨 Original story content warnings:', originalContentWarnings);
    console.log('🚨 One-off specific content warnings:', contentWarnings);
    console.log('🚨 Combined content warnings:', allContentWarnings);
    const oneOffPrompt = `You have been asked to create a one-off chapter. A one-off is a fanfiction-like standalone chapter that branches from an existing story.
ORIGINAL STORY CONTEXT:
- Title: ${originalStory?.title || 'Unknown'}
- Fandom: ${originalStory?.fandom || 'General Fiction'}
- Characters: ${originalStory?.characters || 'Various'}
- Topics: ${originalStory?.topics || 'General'}
- Theme: ${originalStory?.theme || 'Adventure'}
- Original Content Warnings: ${originalContentWarnings.length > 0 ? originalContentWarnings.join(', ') : 'none'}
- Original Age Rating: ${originalStory?.ageRating || 'all-ages'}
ONE-OFF CHAPTER REQUIREMENTS:
- Content warnings for this specific chapter: ${allContentWarnings.length > 0 ? allContentWarnings.join(', ') : 'none'}
- Age rating: ${ageRating}
- User's story direction: "${description}"
CONTENT GUIDELINES:
- You may ONLY include content that matches the specified content warnings
- The content warnings provided are: ${allContentWarnings.length > 0 ? allContentWarnings.join(', ') : 'none'}
- The age rating is: ${ageRating}
- If no content warnings are specified, write content appropriate for "all-ages"
- Do NOT include any NSFW, sexual, violent, or mature content unless explicitly allowed by the content warnings
- All content must be appropriate for the specified age rating
- If content warnings include specific elements (violence, sexual content, etc.), you may include those elements responsibly and appropriately for the age rating
- Content warnings ensure transparency with readers - only write what is disclosed
INSTRUCTIONS:
Continue this story from where the previous chapter left off, but take it in the direction the user specified. This is a one-off fanfiction-style chapter, so you should follow the user's story direction exactly, even if it diverges significantly from what would normally happen in the original story. The user has creative freedom to explore alternative storylines, character developments, or scenarios that wouldn't occur in the main story.
Make this a complete, engaging standalone chapter that fully realizes the user's vision while maintaining the narrative voice and character personalities established in the previous chapters. Since this is fanfiction-like content, prioritize the user's creative direction over canonical story consistency.
Use the established story context (characters, fandom, themes) but feel free to take creative liberties as requested by the user.
WRITING GUIDELINES:
- Use clear, accessible language appropriate for the target audience and age rating
- Include vivid, sensory descriptions to immerse readers in the scene
- Balance dialogue, action, and internal monologue to maintain engagement
- Ensure each character has a distinct voice and personality
- Avoid repetition and clichés
- Aim for a writing style that feels organic and character-driven, not AI-generated
- You can use Markdown formatting
- When writing a new line, use <newline/> to indicate a line break
- Use <paragraph/> tags to indicate a new paragraph
- Aim for 1000-2000 words
FORMAT YOUR OUTPUT AS FOLLOWS:
<chapter>
[Chapter title]
[Your chapter content here, formatted with appropriate paragraphs, dialogue, and scene breaks]
</chapter>
Your final output should consist only of the chapter content within the <chapter> tags and should not include any planning work or explanations.`;
    const result = await generateStoryWithHistory(
      storyName,
      originalStory?.fandom || 'General Fiction',
      originalStory?.characters || '',
      originalStory?.topics || '',
      originalStory?.theme || '',
      allContentWarnings,
      ageRating || 'all-ages',
      conversationHistory,
      undefined, 
      oneOffPrompt
    );
    let generatedContent = result.content || result.fullResponse;
    generatedContent = generatedContent.replace(/<[^>]*>/g, '').trim();
    console.log('✅ One-off content generated successfully');
    return NextResponse.json({
      success: true,
      oneOff: {
        title: storyName,
        content: generatedContent,
        author: username,
        description: description,
        tags: tags || ['fanfiction', 'one-off'],
        contentWarnings: contentWarnings || [],
        ageRating: ageRating || 'all-ages',
        originalStoryId: originalStoryId,
        originalChapter: originalChapter,
        readingTime: `${Math.ceil(generatedContent.length / 1000)} min`,
        createdAt: new Date().toISOString()
      },
      message: 'One-off created successfully'
    });
  } catch (error) {
    console.error('Error in create-one-off API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}