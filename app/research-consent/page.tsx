'use client';
export default function ResearchConsent() {
  return (
    <div className="min-h-screen bg-rose-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-rose-800 dark:text-rose-300 mb-8">Research Participation Information</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg space-y-8">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              By joining Readitt, you are invited to participate in research studying AI's effects on human cognition and creativity. 
              This page explains what we study, how your data is protected, and your rights as a research participant.
            </p>
          </div>
          <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
              Research Overview
            </h2>
            <p className="text-blue-700 dark:text-blue-300 mb-4">
              <strong>Research Question:</strong> How does AI-assisted creative writing affect human creativity, cognitive patterns, and storytelling abilities?
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Your Contribution:</strong> By using Readitt naturally, you help us understand the effects and dangers of AI on human behavior, cognition and creativity.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">What We Study</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400">Reading Analytics</h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                  <li>Reading speed and scroll patterns</li>
                  <li>Completion rates and engagement</li>
                  <li>Pause patterns and backtracking</li>
                  <li>Time spent on different story types</li>
                  <li>Interaction frequency (clicks, navigation)</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400">Creation Patterns</h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                  <li>Story genres and themes chosen</li>
                  <li>Content warnings and age ratings selected</li>
                  <li>Prompt evolution and complexity</li>
                  <li>Creativity indicators in prompts</li>
                  <li>AI dependency vs. originality patterns</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400">Quality Metrics</h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                  <li>Story ratings and reactions</li>
                  <li>Coherence and creativity scores</li>
                  <li>Prompt effectiveness analysis</li>
                  <li>User satisfaction indicators</li>
                  <li>Platform engagement metrics</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400">Behavioral Insights</h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                  <li>Content preference evolution</li>
                  <li>Learning curve patterns</li>
                  <li>Feature adoption and usage</li>
                  <li>Session duration and frequency</li>
                  <li>Cross-device usage patterns</li>
                </ul>
              </div>
            </div>
          </section>
          <section className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
              Privacy & Data Protection
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-green-700 dark:text-green-300 mb-2">Pseudonymized Research IDs</h3>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  All research data is linked to pseudonymized IDs generated locally on your device. These IDs are anonymous and locally generated by your device.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-green-700 dark:text-green-300 mb-2">Story Content Protection</h3>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  <strong>Your story content is NEVER read, analyzed, or stored by our research systems.</strong> We only collect metadata 
                  like genre, content warnings, and basic statistics—never the actual text of your stories.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-green-700 dark:text-green-300 mb-2">Private Stories & One-Offs</h3>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  Private stories and one-off prompts receive additional protection. Only basic anonymized usage patterns are collected, 
                  with no content analysis or detailed behavioral tracking.
                </p>
              </div>
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">Your Rights as a Research Participant</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400">Right to Withdraw</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  You can withdraw from research participation at any time by using the "Delete Account" button in your profile. 
                  This will permanently delete all your research data.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400">Right to Know</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  You have the right to know what data we collect about you. Our Privacy Policy provides complete details, 
                  and you can contact us for additional information.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400">Right to Deletion</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Your research data will be permanently deleted if you delete your account. You can also request deletion 
                  of specific data by contacting our research team.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400">Right to Contact</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  You can contact our research team through Hack Club Slack or your invite provider with any questions, 
                  concerns, or requests regarding your research participation.
                </p>
              </div>
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">Research Benefits</h2>
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400">For You</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                <li>Enhanced platform features</li>
                <li>Contribute to scientific understanding of AI-human creativity</li>
              </ul>
              <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mt-6">For Society</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                <li>Advance understanding of AI's role in human creativity</li>
                <li>Inform ethical AI development practices</li>
                <li>Contribute to academic research on human-AI collaboration</li>
                <li>Help shape the future of creative AI tools</li>
              </ul>
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">Data Retention & Usage</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Retention Period</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Research data is retained for up to 2 years for analysis purposes. Anonymous aggregated insights may be kept longer 
                  for academic publication, but cannot be traced back to individual users.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Research Usage</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Data may be used for private publications on the Hack Club slack, as well as <a className="text-rose-600 hover:text-rose-800 underline" href="https://research.pluraldan.link" target="_blank" rel="noopener noreferrer">Dan's research blog</a>.
                  All published research uses only aggregated, anonymous data that cannot identify individual participants.
                </p>
              </div>
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">Contact Information</h2>
            <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-rose-800 dark:text-rose-300 mb-3">Research Team Contact</h3>
              <div className="space-y-2 text-sm text-rose-700 dark:text-rose-300">
                <p><strong>Primary Contact:</strong> dan@pluraldan.link</p>
                <p><strong>Slack:</strong> Available through Hack Club Slack (#ai-research)</p>
                <p><strong>Alternative:</strong> Contact through your Readitt invite provider</p>
              </div>
              <div className="mt-4 p-3 bg-rose-100 dark:bg-rose-800/30 rounded">
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  <strong>Questions or concerns?</strong> We're committed to transparency and ethical research practices. 
                  Don't hesitate to reach out with any questions about your participation or data usage.
                </p>
              </div>
            </div>
          </section>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Thank you for contributing to AI and creativity research. Your participation helps advance our understanding 
              of human-AI collaboration and shapes the future of creative tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}