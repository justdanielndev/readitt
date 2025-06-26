'use client';
import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { SimpleHeader } from './SimpleHeader';
import { supabase } from '@/lib/supabase';
import { UserContextManager } from '@/lib/userContext';
import { saveUserStory } from '@/lib/userStories';
import type { Fandom, Story } from './HomepageView';
interface StoryGenerationProps {
  fandom: Fandom;
  onStoryGenerated: (story: Story) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
}
const generationSteps = [
  'Analyzing fandom context...',
  'Generating plot outline...',
  'Creating characters...',
  'Writing opening chapter...',
  'Polishing narrative...',
  'Story ready!'
];
export function StoryGeneration({ 
  fandom, 
  onStoryGenerated, 
  isGenerating, 
  setIsGenerating 
}: StoryGenerationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const generationStartedRef = useRef(false);
  useEffect(() => {
    if (!generationStartedRef.current) {
      generationStartedRef.current = true;
      generateStory();
    }
  }, []);
  const generateStory = async () => {
    console.log('generateStory called for fandom:', fandom.name);
    setIsGenerating(true);
    setCurrentStep(0);
    setProgress(0);
    try {
      const storyParams = (fandom as any).storyParams || {
        storyName: `Adventures in ${fandom.name}`,
        characters: '',
        topics: 'adventure, discovery',
        theme: 'courage and friendship',
        contentWarnings: [],
        ageRating: 'all-ages'
      };
      console.log('📋 Story params received in generation:', storyParams);
      console.log('🚨 Content warnings in generation:', storyParams.contentWarnings);
      console.log('🔞 Age rating in generation:', storyParams.ageRating);
      const storyName = storyParams.storyName;
      const userContext = UserContextManager.getInstance().getUserContext();
      const response = await fetch('/api/generate-story-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userContext.userId,
          'x-username': userContext.username,
        },
        body: JSON.stringify({
          fandom: fandom.name,
          description: fandom.description,
          storyName,
          characters: storyParams.characters,
          topics: storyParams.topics,
          theme: storyParams.theme,
          isPrivate: storyParams.isPrivate,
          contentWarnings: storyParams.contentWarnings || [],
          ageRating: storyParams.ageRating || 'all-ages',
          author: userContext.username
        }),
      });
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  throw new Error(data.error);
                }
                if (data.progress !== undefined) {
                  setProgress(data.progress);
                  if (data.progress < 33) {
                    setCurrentStep(0); 
                  } else if (data.progress < 66) {
                    setCurrentStep(1); 
                  } else if (data.progress < 100) {
                    setCurrentStep(2); 
                  } else {
                    setCurrentStep(5); 
                  }
                }
                if (data.result) {
                  console.log('Story generation result received:', data.result);
                  const generatedStory = data.result;
                  const formattedStory: Story = {
                    id: generatedStory.storyId || `temp-${Date.now()}`,
                    title: generatedStory.title || storyName,
                    fandom: fandom.name,
                    genre: ['Adventure', 'Fantasy'],
                    description: `An AI-generated adventure set in the ${fandom.name} universe`,
                    tags: ['ai-generated', 'interactive'],
                    author: `${UserContextManager.getInstance().getUserContext().username}`,
                    totalChapters: 1,
                    lastUpdated: new Date().toISOString().split('T')[0],
                    chapters: [
                      {
                        id: `chapter-${Date.now()}`,
                        number: 1,
                        title: generatedStory.title || 'Chapter 1',
                        content: generatedStory.content,
                        readingTime: '4 min',
                        upvotes: 0,
                        downvotes: 0,
                      }
                    ],
                    conversationHistory: generatedStory.conversationHistory || []
                  };
                  if (generatedStory.isPrivate) {
                    console.log('🔒 Saving private story to localStorage only');
                    saveUserStory({
                      id: generatedStory.storyId,
                      title: generatedStory.title || storyName,
                      fandom: fandom.name,
                      shareToken: null, 
                      isPrivate: true,
                      isOwner: true,
                      storyData: generatedStory.storyData 
                    });
                  } else if (generatedStory.shareToken) {
                    console.log('🌐 Saving public story to localStorage with share token');
                    saveUserStory({
                      id: generatedStory.storyId,
                      title: generatedStory.title || storyName,
                      fandom: fandom.name,
                      shareToken: generatedStory.shareToken,
                      isPrivate: false,
                      isOwner: true
                    });
                  }
                  console.log('Calling onStoryGenerated with story ID:', formattedStory.id);
                  onStoryGenerated(formattedStory);
                  return;
                }
              } catch (parseError) {
                console.error('Error parsing stream data:', parseError);
              }
            }
          }
        }
      } else {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        createFallbackStory();
      }
    } catch (error) {
      console.error('Error generating story:', error);
      createFallbackStory();
    }
  };
  const createFallbackStory = () => {
    const titles = [
      `Adventures in ${fandom.name}`,
      `The ${fandom.name} Chronicles`,
      `Secrets of ${fandom.name}`,
      `Journey Through ${fandom.name}`,
      `The Last ${fandom.name} Hero`
    ];
    const story: Story = {
      id: `fallback-${Date.now()}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      fandom: fandom.name,
      genre: ['Adventure', 'Fantasy', 'Drama'],
      description: `An AI-generated adventure set in the ${fandom.name} universe`,
      tags: ['ai-generated', 'adventure', 'custom-fandom'],
      author: `${UserContextManager.getInstance().getUserContext().username}`,
      totalChapters: 12,
      lastUpdated: new Date().toISOString().split('T')[0],
      chapters: [
        {
          id: `chapter-${Date.now()}`,
          number: 1,
          title: 'A New Beginning',
          content: `In the world of ${fandom.name}, nothing was ever as it seemed. The morning sun cast long shadows across the landscape, and our protagonist stood at the crossroads of destiny.
${fandom.description || `This story takes place in the rich universe of ${fandom.name}, where magic and mystery intertwine.`}
As the adventure begins, we find ourselves drawn into a tale of courage, friendship, and the eternal struggle between light and darkness. The characters we'll meet along this journey will challenge everything we thought we knew about heroism and sacrifice.
The wind whispered secrets of ancient times, and somewhere in the distance, a new chapter of history was about to unfold. This is just the beginning of an epic tale that will take us through trials and triumphs, losses and victories.
Every great story starts with a single step, and this is ours. Welcome to ${fandom.name}, where your adventure awaits.`,
          readingTime: '3 min',
          upvotes: 0,
          downvotes: 0,
        }
      ]
    };
    onStoryGenerated(story);
  };
  return (
    <div className="min-h-screen">
      <SimpleHeader onLogoClick={() => window.location.href = '/'} />
      <div className="flex items-center justify-center px-4 min-h-[calc(100vh-4rem)]">
      <div className="max-w-md w-full text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto mb-6">
            <Loader2 className="w-full h-full text-rose-300 animate-spin" />
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-rose-300 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          We're crafting your story...
        </h2>
        <div className="mt-8 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800">
          <div className="text-sm text-rose-700 dark:text-rose-300 mb-1">
            Generating for
          </div>
          <div className="font-semibold text-rose-900 dark:text-rose-100">
            {fandom.name}
          </div>
          {fandom.description && (
            <div className="text-xs text-rose-600 dark:text-rose-400 mt-1">
              {fandom.description}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}