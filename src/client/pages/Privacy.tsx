import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <main className="legal-page page-container">
      <h1 className="legal-title">Privacy Policy</h1>
      <p className="legal-updated">Last updated: 22 March 2026</p>

      <section className="legal-section">
        <h2>Who we are</h2>
        <p>
          Taleium is a trading name of <strong>Kabooly Ltd</strong>, a company registered in England and Wales
          (company number 15653819). Our registered address is 23 Carisbrooke House, Seven Kings Way,
          Kingston Upon Thames, KT2 5BS, United Kingdom.
        </p>
        <p>
          We are registered with the Information Commissioner's Office (ICO), registration number <strong>ZC086840</strong>.
        </p>
        <p>
          For any privacy-related queries, contact us at{' '}
          <a href="mailto:hello@kabooly.com">hello@kabooly.com</a>.
        </p>
      </section>

      <section className="legal-section">
        <h2>What data we collect</h2>
        <p>When you use Taleium, we collect and process the following personal data:</p>
        <ul>
          <li><strong>Account information:</strong> your name, email address, and a securely hashed password (PBKDF2 with 100,000 iterations). We never store your password in plain text.</li>
          <li><strong>Story content:</strong> the books and chapters you create, including titles, descriptions, prompts, and AI-generated text.</li>
          <li><strong>Payment information:</strong> if you subscribe to Taleium Premium, payment is processed by Stripe. We store your Stripe customer ID and subscription status but never see or store your card details.</li>
          <li><strong>Session data:</strong> we use a single essential HttpOnly cookie to keep you signed in. This cookie expires after 30 days. We do not use tracking cookies, analytics cookies, or any third-party advertising cookies.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>How we use your data</h2>
        <ul>
          <li>To provide the Taleium service: creating and storing your stories, managing your account, and processing payments.</li>
          <li>To send you a signup notification confirming your account.</li>
          <li>To generate age-appropriate story content using AI (see "AI and your content" below).</li>
          <li>To enforce free tier limits and manage your subscription.</li>
        </ul>
        <p>We do not sell your personal data. We do not use your data for advertising.</p>
      </section>

      <section className="legal-section">
        <h2>AI and your content</h2>
        <p>
          Taleium uses Anthropic's Claude AI to generate story chapters and suggest story directions.
          When you create a chapter, your story prompts and relevant context from your book are sent to
          Anthropic's API to generate the text. Anthropic does not use this data to train their AI models.
        </p>
        <p>
          The stories you create are yours. AI-generated content is produced at your direction and
          belongs to you.
        </p>
      </section>

      <section className="legal-section">
        <h2>Third-party services</h2>
        <p>We use the following third-party services to operate Taleium:</p>
        <ul>
          <li><strong>Cloudflare:</strong> hosting, database storage, and content delivery. Your data is stored in Cloudflare's infrastructure. See <a href="https://www.cloudflare.com/en-gb/privacypolicy/" target="_blank" rel="noopener noreferrer">Cloudflare's privacy policy</a>.</li>
          <li><strong>Anthropic (Claude AI):</strong> AI-powered story generation. See <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">Anthropic's privacy policy</a>.</li>
          <li><strong>Stripe:</strong> payment processing for Premium subscriptions. See <a href="https://stripe.com/gb/privacy" target="_blank" rel="noopener noreferrer">Stripe's privacy policy</a>.</li>
          <li><strong>Resend:</strong> transactional email delivery (signup notifications). See <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Resend's privacy policy</a>.</li>
          <li><strong>Wikimedia Commons:</strong> book cover images sourced from publicly available media.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Children's privacy</h2>
        <p>
          Taleium is designed for families to use together. We do not create accounts for children.
          A parent or guardian creates and manages the account, and children participate under their supervision
          on the same device and session. We do not knowingly collect personal information from children
          under 13.
        </p>
        <p>
          If you believe a child has provided us with personal data without parental consent, please
          contact us at <a href="mailto:hello@kabooly.com">hello@kabooly.com</a> and we will delete it promptly.
        </p>
      </section>

      <section className="legal-section">
        <h2>Cookies</h2>
        <p>
          We use a single essential cookie to maintain your login session. This is a strictly necessary
          cookie required for the service to function. We do not use any optional, analytics, or
          advertising cookies. Because we only use strictly necessary cookies, no cookie consent
          banner is required under UK/EU regulations.
        </p>
      </section>

      <section className="legal-section">
        <h2>Data retention</h2>
        <p>
          We retain your account data and story content for as long as your account is active.
          If you delete your account, your personal data and stories will be permanently removed.
          Session records expire automatically after 30 days.
        </p>
      </section>

      <section className="legal-section">
        <h2>Your rights</h2>
        <p>Under UK data protection law (UK GDPR), you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Correct any inaccurate personal data</li>
          <li>Request deletion of your personal data</li>
          <li>Object to or restrict processing of your data</li>
          <li>Data portability (receive your data in a structured format)</li>
          <li>Withdraw consent at any time (where processing is based on consent)</li>
        </ul>
        <p>
          To exercise any of these rights, email us at{' '}
          <a href="mailto:hello@kabooly.com">hello@kabooly.com</a>.
          We will respond within 30 days.
        </p>
        <p>
          If you are not satisfied with our response, you have the right to complain to the{' '}
          <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer">Information Commissioner's Office (ICO)</a>.
        </p>
      </section>

      <section className="legal-section">
        <h2>Changes to this policy</h2>
        <p>
          We may update this privacy policy from time to time. We will update the "last updated" date
          at the top of this page. Continued use of Taleium after changes constitutes acceptance of
          the updated policy.
        </p>
      </section>

      <div className="legal-nav">
        <Link to="/terms">Terms of Service</Link>
      </div>
    </main>
  );
}
