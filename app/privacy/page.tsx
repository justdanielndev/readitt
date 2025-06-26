'use client';
export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-rose-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-rose-800 dark:text-rose-300 mb-8">Privacy Policy</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg space-y-8">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              <strong>Last updated:</strong> 26th of June 2025
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Readitt ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and protect your information when you use our platform.
            </p>
          </div>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">1. Information We Collect</h2>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">1.1 Account Information</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Display name (chosen by you)</li>
              <li>Profile picture (if uploaded)</li>
              <li>Slack account information (if you log in via Slack)</li>
              <li>Language preferences</li>
              <li>Content preferences (18+ settings)</li>
            </ul>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">1.2 Content Data</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Stories you create or save</li>
              <li>Reading progress and history</li>
              <li>Comments and reactions</li>
              <li>Playlists and collections</li>
            </ul>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">1.3 Research Data (Pseudonymised)</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Reading analytics (scroll speed, completion rates)</li>
              <li>Story creation patterns and preferences</li>
              <li>Prompt analysis for AI improvement</li>
              <li>Usage statistics and engagement metrics</li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <strong>Note:</strong> All research data is collected with a pseudonymised research ID that cannot be linked back to your account.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">2. How We Use Your Information</h2>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">2.1 Service Provision</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Provide and maintain the Readitt platform</li>
              <li>Save your reading progress and preferences</li>
              <li>Generate AI-powered story content</li>
              <li>Enable social features (comments, sharing)</li>
            </ul>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">2.2 Research and Improvement</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Conduct anonymous research to study AI's effects on creativity and cognition</li>
              <li>Analyze reading patterns to improve story recommendations</li>
              <li>Enhance AI models based on user interactions</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">3. Data Storage and Security</h2>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">3.1 Local Storage</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Most of your data is stored locally on your device using browser storage. This includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>User preferences and settings</li>
              <li>Reading progress and history</li>
              <li>Anonymous research ID</li>
              <li>GDPR consent records</li>
            </ul>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">3.2 Cloud Storage</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Some data is stored in our secure cloud database:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Public stories and their metadata</li>
              <li>Comments and community interactions</li>
              <li>Anonymous research data (via Airtable)</li>
            </ul>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">3.3 Security Measures</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Data minimization - we only collect what's necessary</li>
              <li>Pseudonymised research IDs for analytics</li>
              <li>Secure HTTPS connections</li>
              <li>Regular security audits</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">4. Your Rights Under GDPR</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <p className="text-blue-800 dark:text-blue-300 font-medium mb-2">
                As a user, you have the following rights:
              </p>
            </div>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">4.1 Right to Access</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You can access all your data through the Profile section. Export your data using QR codes.
            </p>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">4.2 Right to Rectification</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You can update your username, preferences, and other account information at any time.
            </p>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">4.3 Right to Erasure ("Right to be Forgotten")</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Use the "Delete Account" button to permanently remove all your data, including research data.
            </p>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">4.4 Right to Data Portability</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Export your data as QR codes that can be imported on other devices.
            </p>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">4.5 Right to Object</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You can withdraw consent for research data collection at any time.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">5. Third-Party Services</h2>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">5.1 AI Services</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We use AI for story generation. Your prompts are sent to the AI providers but are not linked to your identity and are not used to improve AI models or shared.
            </p>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">5.2 Research Database</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Pseudonymised research data is stored in Airtable for analysis. This data cannot be traced back to you.
            </p>
            <h3 className="text-xl font-medium text-rose-600 dark:text-rose-400 mb-3">5.3 Authentication</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Slack authentication is provided by Slack (if you choose to use it).
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">6. Data Retention</h2>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li><strong>Account Data:</strong> Stored until you delete your account</li>
              <li><strong>Stories:</strong> Public stories remain available unless deleted</li>
              <li><strong>Research Data:</strong> Anonymous data may be retained for research purposes, but all pseudonymised data will be deleted upon account deletion</li>
              <li><strong>Local Data:</strong> Cleared when you clear browser data or delete account</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">7. International Transfers</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Your data may be processed in countries outside the EU/EEA. We ensure appropriate safeguards are in place for any international transfers.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Users under 18 (especially Slack users from Hack Club) have additional protections:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>18+ content is automatically disabled</li>
              <li>Additional content filtering</li>
              <li>Limited data collection</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may update this privacy policy from time to time. We will notify users of significant changes through the platform.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mb-4">10. Contact Information</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              For any privacy-related questions or to exercise your rights, please contact us through the Hack Club Slack or through the person that invited you to Readitt.
            </p>
            <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg">
              <p className="text-rose-800 dark:text-rose-300 font-medium">
                Data Controller: Readitt Team<br />
                Contact: Available through Hack Club Slack
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}