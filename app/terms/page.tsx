'use client';
export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-rose-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-rose-800 dark:text-rose-300 mb-8">Terms of Service</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg space-y-8">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              <strong>Last updated:</strong> 26th of June, 2025
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Welcome to Readitt! These Terms of Service ("Terms") govern your use of our platform. 
              By using Readitt, you agree to these terms.
            </p>
          </div>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              By accessing or using Readitt, you agree to be bound by these Terms and our Privacy Policy. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Readitt is an AI-powered creative writing platform that allows users to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Create and read AI-generated stories</li>
              <li>Share stories with the community</li>
              <li>Track reading progress</li>
              <li>Participate in community discussions</li>
              <li>Access content in multiple languages</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">3.1 Account Creation</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>You may create an account by entering your invite code</li>
              <li>You may optionally connect via Slack authentication</li>
              <li>You are responsible for maintaining account security</li>
              <li>One account per person</li>
            </ul>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">3.2 Account Responsibilities</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Provide accurate information</li>
              <li>Keep your account secure</li>
              <li>Notify us of unauthorized access</li>
              <li>You are responsible for all activity on your account</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">4. Content and Conduct</h2>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">4.1 User-Generated Content</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You retain ownership of content you create, but by using Readitt you grant us:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Right to display your public stories on the platform</li>
              <li>Right to use pseudonymised data for research and improvement (if agreed when creating an account)</li>
              <li>Right to moderate content for community safety</li>
            </ul>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">4.2 Prohibited Content</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">You may not create or share content that:</p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Violates any law or regulation</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains hate speech or promotes violence</li>
              <li>Harasses or threatens other users</li>
              <li>Contains spam or malicious content</li>
              <li>Is sexually explicit involving minors</li>
            </ul>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">4.3 Age-Appropriate Content</h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
              <p className="text-yellow-800 dark:text-yellow-300">
                <strong>Special Notice for Hack Club Users:</strong> As many of our users are under 18, 
                we maintain higher content standards and automatically disable 18+ content for Slack users.
              </p>
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">5. AI-Generated Content</h2>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">5.1 AI Content Disclaimer</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Stories are generated by AI</li>
              <li>AI-generated content may contain inaccuracies</li>
              <li>You should not rely on AI content for factual information</li>
              <li>AI may occasionally produce unexpected or inappropriate content</li>
            </ul>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">5.2 Content Ownership</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              AI-generated content becomes yours when created through your prompts, but you acknowledge 
              that similar content could be generated for other users.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">6. Privacy and Data</h2>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">6.1 Data Collection</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              By using Readitt, you consent to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Collection of reading analytics for research</li>
              <li>Analysis of story creation patterns</li>
              <li>Prompt analysis for AI improvement</li>
              <li>Pseudonymised usage statistics</li>
            </ul>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">6.2 Data Rights</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You maintain full control over your data and can delete your account at any time. 
              See our <a href="/privacy" className="text-rose-600 hover:text-rose-800 underline">Privacy Policy</a> for details.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">7. Community Guidelines</h2>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">7.1 Respectful Interaction</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Be respectful to other users</li>
              <li>Provide constructive feedback</li>
              <li>Respect different perspectives and creativity</li>
              <li>Help maintain a welcoming environment</li>
            </ul>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">7.2 Reporting</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you encounter inappropriate content or behavior, please report it through our 
              contact points (person that gave you an invite) or contact us via Hack Club Slack at #ai-research.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">8. Service Availability</h2>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">8.1 Service Uptime</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We strive to maintain service availability but cannot guarantee uninterrupted access. 
              The service may be temporarily unavailable due to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Scheduled maintenance</li>
              <li>Technical issues</li>
              <li>Third-party service outages (AI providers)</li>
              <li>Emergency security measures</li>
            </ul>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">8.2 Service Modifications</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We reserve the right to modify or discontinue features with reasonable notice to users.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Readitt is provided "as is" without warranties. We are not liable for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Loss of data or content</li>
              <li>Service interruptions</li>
              <li>AI-generated content accuracy</li>
              <li>User-generated content</li>
              <li>Indirect or consequential damages</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">10. Intellectual Property</h2>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">10.1 Platform Rights</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Readitt and its original content, features, and functionality are owned by the Readitt team 
              and are protected by copyright and other intellectual property laws.
            </p>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">10.2 User Content Rights</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You retain rights to content you create, but you should not post content that infringes 
              on others' intellectual property rights.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">11. Termination</h2>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">11.1 Account Termination</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You may delete your account at any time. We may suspend or terminate accounts for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Violation of these Terms</li>
              <li>Inappropriate content or behavior</li>
              <li>Extended account inactivity</li>
              <li>Legal requirements</li>
            </ul>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">11.2 Effect of Termination</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Upon termination, your access ends but public content may remain unless you delete it first.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">12. Governing Law</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              These Terms are governed by applicable local laws. Any disputes will be resolved through 
              informal discussion first, with formal legal proceedings as a last resort.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">13. Changes to Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may update these Terms periodically. Significant changes will be announced through the platform. 
              Continued use after changes constitutes acceptance of the new terms.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">14. Contact Information</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              For questions about these Terms, please contact us through the Hack Club Slack or 
              through your invite provider.
            </p>
            <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg">
              <p className="text-rose-800 dark:text-rose-300 font-medium">
                Service Provider: Readitt Team<br />
                Contact: Available through Hack Club Slack<br />
              </p>
            </div>
          </section>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              By using Readitt, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}