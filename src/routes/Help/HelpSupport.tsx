import { useState } from "react";
import {
  HelpCircle,
  Mail,
  MessageCircle,
  Book,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { APP_NAME } from "@/config/seo";

const HelpSupport = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I create a story?",
      answer:
        "To create a story, use the 'Create Story' option from the navigation menu. You'll be able to set up your story details, add chapters, and start writing.",
    },
    {
      question: "How do I connect my wallet?",
      answer:
        "Click on the 'Connect Wallet' button in the navbar. Make sure you have a compatible wallet installed (like MetaMask) and follow the connection prompts.",
    },
    {
      question: "Can I edit my stories after publishing?",
      answer:
        "Yes, you can edit your stories at any time. Go to 'My Stories' from the user dropdown menu and select the story you want to edit.",
    },
    {
      question: "How do I tip an author?",
      answer:
        "While reading a story, you'll see a 'Tip Author' button. Click it to open the tipping modal where you can choose an amount and send a tip using your connected wallet.",
    },
    {
      question: "What networks are supported?",
      answer:
        "Currently, we support Sepolia testnet. Make sure your wallet is connected to the correct network to use all features.",
    },
    {
      question: "How do I join a book club?",
      answer:
        "Navigate to the 'Book Clubs' section from the main navigation. Browse available clubs and click 'Join' on any club you're interested in.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-black dark:text-white py-8 px-4">
      <SEOHead
        title={`Help & Support - ${APP_NAME}`}
        description={`Get help using ${APP_NAME}. Find answers to frequently asked questions about writing, publishing, wallets, and account settings.`}
        keywords={["help", "support", "FAQ", "how to write", "how to publish"]}
        url="/help"
        canonical="/help"
      />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-4">
            <HelpCircle className="w-16 h-16 text-dark-green dark:text-light-green" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Help & Support</h1>
          <p className="text-black/70 dark:text-white/70 text-lg">
            Find answers to common questions or get in touch with our support
            team
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Link
            to="/privacy-policy"
            className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-black/10 dark:border-white/10 p-6 hover:border-dark-green dark:hover:border-light-green transition-colors group"
          >
            <Shield className="w-8 h-8 text-dark-green dark:text-light-green mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">Privacy Policy</h3>
            <p className="text-sm text-black/60 dark:text-white/60">
              Learn how we protect your data
            </p>
            <ExternalLink className="w-4 h-4 mt-2 text-dark-green dark:text-light-green" />
          </Link>

          <Link
            to="/terms-of-use"
            className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-black/10 dark:border-white/10 p-6 hover:border-dark-green dark:hover:border-light-green transition-colors group"
          >
            <Book className="w-8 h-8 text-dark-green dark:text-light-green mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">Terms of Use</h3>
            <p className="text-sm text-black/60 dark:text-white/60">
              Read our terms and conditions
            </p>
            <ExternalLink className="w-4 h-4 mt-2 text-dark-green dark:text-light-green" />
          </Link>

          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-black/10 dark:border-white/10 p-6">
            <MessageCircle className="w-8 h-8 text-dark-green dark:text-light-green mb-3" />
            <h3 className="font-semibold mb-2">Contact Support</h3>
            <p className="text-sm text-black/60 dark:text-white/60 mb-4">
              Need more help? Reach out to us
            </p>
            <a
              href="mailto:shoibal.not@gmail.com"
              className="text-sm text-dark-green dark:text-light-green hover:underline flex items-center gap-1"
            >
              <Mail className="w-4 h-4" />
              khaledhossain.not@gmail.com
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-black/10 dark:border-white/10 p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border-b border-black/10 dark:border-white/10 last:border-0 pb-4 last:pb-0"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between text-left hover:text-dark-green dark:hover:text-light-green transition-colors"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <p className="mt-3 text-black/70 dark:text-white/70 pl-2">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-black/10 dark:border-white/10 p-6">
          <h2 className="text-2xl font-semibold mb-4">Still Need Help?</h2>
          <p className="text-black/70 dark:text-white/70 mb-6">
            If you can't find what you're looking for, don't hesitate to reach
            out to our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:shoibal.not@gmail.com"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-dark-green dark:bg-light-green hover:bg-light-green dark:hover:bg-dark-green text-white font-semibold rounded-md transition-colors"
            >
              <Mail className="w-5 h-5" />
              Email Support
            </a>
            <a
              href="#"
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-dark-green dark:border-light-green text-dark-green dark:text-light-green hover:bg-dark-green dark:hover:bg-light-green hover:text-white font-semibold rounded-md transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Live Chat
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
