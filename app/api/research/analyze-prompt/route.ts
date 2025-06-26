import { NextRequest, NextResponse } from 'next/server';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export async function POST(request: NextRequest) {
  try {
    const { prompt, promptType } = await request.json();
    if (!ANTHROPIC_API_KEY) {
      console.log('🔍 [PROMPT ANALYSIS] Anthropic API not configured, returning mock data');
      return NextResponse.json({
        analysis: {
          complexityScore: 5,
          coherenceScore: 5,
          creativityScore: 5,
          aiDependencyLevel: 5,
          originalityScore: 5,
          effortScore: 5,
          repetitivenessScore: 5,
          lazinessIndicators: ['mock_analysis'],
        }
      });
    }
    console.log('🔍 [PROMPT ANALYSIS] Analyzing prompt with Claude:', { promptType });
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANTHROPIC_API_KEY}`,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', 
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [PROMPT ANALYSIS] Claude API error:', errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }
    const result = await response.json();
    const analysisText = result.content[0].text;
    console.log('🔍 [PROMPT ANALYSIS] Raw Claude response:', analysisText);
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in Claude response');
      }
    } catch (parseError) {
      console.error('❌ [PROMPT ANALYSIS] Failed to parse Claude response:', parseError);
      analysis = {
        complexityScore: 5,
        coherenceScore: 5,
        creativityScore: 5,
        aiDependencyLevel: 5,
        originalityScore: 5,
        effortScore: 5,
        repetitivenessScore: 5,
        lazinessIndicators: ['parse_error'],
      };
    }
    console.log('✅ [PROMPT ANALYSIS] Analysis completed:', {
      complexity: analysis.complexityScore,
      creativity: analysis.creativityScore,
      effort: analysis.effortScore
    });
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('❌ [PROMPT ANALYSIS] Analysis failed:', error);
    return NextResponse.json(
      { error: 'Failed to analyze prompt' },
      { status: 500 }
    );
  }
}