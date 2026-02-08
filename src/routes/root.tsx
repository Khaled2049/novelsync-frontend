import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  BookOpen,
  Trophy,
  Coins,
  Wand2,
  Brain,
  ListChecks,
  Home,
  Zap,
  AlertCircle,
} from "lucide-react";
import { SEOHead } from "@/components/SEO/SEOHead";
import { APP_NAME } from "@/config/seo";

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();
  

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: "Smart Text Editor",
      description:
        "A powerful, distraction-free writing environment designed specifically for storytelling.",
    },
    {
      icon: Wand2,
      title: "AI Writing Assistant",
      description:
        "Get intelligent suggestions and generate contextually correct lines using your story's plots, characters, and lore.",
    },
    {
      icon: Brain,
      title: "Story Context Manager",
      description:
        "Build rich worlds with dedicated tools for plots, characters, and lore that power smarter AI assistance.",
    },
    {
      icon: Home,
      title: "Community Feed & Book Clubs",
      description:
        "Join book clubs and to connect with writers, discuss, and discover stories together.",
    },
    {
      icon: ListChecks,
      title: "Book Lists",
      description:
        "Curate and share your favorite stories with custom book lists for any occasion or genre.",
    },
    {
      icon: Coins,
      title: "Crypto Tipping",
      description:
        "Support your favorite authors directly with cryptocurrency tips. Authors keep 90%, platform takes 10%.",
    },
    {
      icon: Trophy,
      title: "Story Competitions",
      description:
        "Compete for prizes in smart contract-powered competitions. Transparent voting, guaranteed payouts, zero platform bias.",
    },
    {
      icon: Zap,
      title: "Built for Scale",
      description:
        "React, TypeScript, and Firebase power a fast, reliable platform that grows with your stories.",
    },
  ];

  return (
    <>
      <SEOHead
        title={`${APP_NAME} - AI-Powered Novel Writing Platform`}
        description="Create, organize, and enhance your stories with AI-powered writing assistants. Join book clubs, discover stories, and connect with writers in a collaborative writing community. Features smart text editor, AI writing assistant, story context manager, and crypto tipping."
        keywords={[
          "novel writing",
          "AI writing assistant",
          "story creation",
          "book clubs",
          "writing platform",
          "creative writing",
          "storytelling",
          "author tools",
          "writing community",
          "story collaboration",
          "crypto tipping",
          "writing competitions",
        ]}
        url="/"
        type="website"
      />
      <div className="min-h-screen bg-neutral-50 dark:bg-black text-black dark:text-white">
        {/* Beta Banner */}
        <div className="w-full bg-gradient-to-r from-dark-green to-light-green text-white py-3 sm:py-4 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 animate-pulse" />
            <p className="text-sm sm:text-base font-medium text-center">
              This website is currently in beta. We're using Sepolia testnet and
              conducting load testing. All data can be lost. We'll be moving to
              a new domain soon!
            </p>
          </div>
        </div>

        <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6">
          <div
            className="relative z-10 text-center max-w-5xl mx-auto"
            style={{
              transform: `translateY(${scrollY * 0.5}px)`,
              opacity: 1 - scrollY / 500,
            }}
          >
            <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-6 text-dark-green dark:text-light-green animate-pulse" />

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="block text-black dark:text-white">
                Write Stories That
              </span>
              <span className="block bg-gradient-to-r from-dark-green to-light-green bg-clip-text text-transparent">
                Matter
              </span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-black/70 dark:text-white/70 mb-10 max-w-3xl mx-auto px-4">
              AI-powered writing tools, vibrant communities, and fair crypto
              rewards. Everything you need to write, share, and earn from your
              stories.
            </p>

            <button
              onClick={() => navigate("/explore")}
              className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-dark-green to-light-green text-white rounded-full font-semibold text-base sm:text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Get Started
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
                Everything You Need to Create
              </h2>
              <p className="text-lg sm:text-xl text-black/70 dark:text-white/70">
                Professional tools for modern storytellers
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative p-6 sm:p-8 bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border-2 border-black/10 dark:border-white/10 hover:border-dark-green dark:hover:border-light-green transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                  style={{
                    animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-dark-green to-light-green p-3 sm:p-3.5 mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    <feature.icon className="w-full h-full text-white" />
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-2 sm:mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-black/70 dark:text-white/70 text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-dark-green/0 to-light-green/0 group-hover:from-dark-green/5 group-hover:to-light-green/5 transition-all duration-500 pointer-events-none"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-b from-transparent via-light-green/5 to-transparent dark:via-dark-green/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-black dark:text-white mb-12 sm:mb-16">
              How It Works
            </h2>

            <div className="space-y-8 sm:space-y-12">
              {[
                {
                  num: "01",
                  title: "Start writing your story",
                  desc: "Use our smart editor with AI assistance that understands your characters, plots, and world.",
                },
                {
                  num: "02",
                  title: "Build Your World",
                  desc: "Add plots, characters, and lore to give context that makes every AI suggestion better.",
                },
                {
                  num: "03",
                  title: "Share & Earn",
                  desc: "Post to the community feed, receive crypto tips, and compete in prize competitions.",
                },
                {
                  num: "04",
                  title: "Grow Together",
                  desc: "Join book clubs, create lists, and discover stories from writers like you.",
                },
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-4 sm:gap-6">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-dark-green to-light-green flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                    {step.num}
                  </div>
                  <div className="pt-1 sm:pt-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-black/70 dark:text-white/70 text-base sm:text-lg">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Competitions Highlight */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="relative p-8 sm:p-10 md:p-16 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-dark-green to-light-green overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEyYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>

              <div className="relative z-10 text-center text-white">
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6" />
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6">
                  Smart Contract Competitions
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-white/90 max-w-3xl mx-auto">
                  Compete for real prizes with transparent voting and guaranteed
                  payouts. No platform bias, no hidden rules—just fair
                  competition powered by blockchain.
                </p>
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-base sm:text-lg">
                  <div>
                    <div className="font-bold text-xl sm:text-2xl mb-1">
                      10%
                    </div>
                    <div className="text-white/80">Platform Fee</div>
                  </div>
                  <div>
                    <div className="font-bold text-xl sm:text-2xl mb-1">
                      100%
                    </div>
                    <div className="text-white/80">Transparent</div>
                  </div>
                  <div>
                    <div className="font-bold text-xl sm:text-2xl mb-1">0</div>
                    <div className="text-white/80">Platform Bias</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-black dark:bg-neutral-950">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ready to Write Your Story?
            </h2>
            <p className="text-lg sm:text-xl text-white/70 mb-8 sm:mb-10 px-4">
              Join thousands of writers creating amazing stories with AI
              assistance, earning crypto rewards, and building communities.
            </p>
            <button
              onClick={() => navigate("/sign-up")}
              className="px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-light-green to-dark-green text-white rounded-full font-bold text-lg sm:text-xl hover:scale-105 transition-transform duration-300 hover:shadow-2xl"
            >
              Create an account
            </button>
          </div>
        </section>

        <style>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px); 
            opacity: 0.3; 
          }
          50% { 
            transform: translateY(-20px) translateX(10px); 
            opacity: 0.6; 
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      </div>
    </>
  );
}
