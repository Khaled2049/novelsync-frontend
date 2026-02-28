import React from "react";
import { Helmet } from "react-helmet-async";
import {
  SEO_CONFIG,
  truncateDescription,
  getCanonicalUrl,
  getAbsoluteUrl,
} from "@/config/seo";

export interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "book";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
  structuredData?: object | object[];
}

/**
 * SEOHead Component
 * Manages meta tags, Open Graph, and Twitter Cards for SEO
 */
export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  author,
  publishedTime,
  modifiedTime,
  noindex = false,
  nofollow = false,
  canonical,
  structuredData,
}) => {
  // Use defaults if not provided
  const pageTitle = title
    ? `${title} - ${SEO_CONFIG.siteName}`
    : SEO_CONFIG.defaultTitle;
  const pageDescription = description
    ? truncateDescription(description)
    : SEO_CONFIG.defaultDescription;
  const pageKeywords = keywords
    ? [...SEO_CONFIG.defaultKeywords, ...keywords].join(", ")
    : SEO_CONFIG.defaultKeywords.join(", ");
  const pageImage = image
    ? getAbsoluteUrl(image)
    : getAbsoluteUrl(SEO_CONFIG.defaultImage);
  const pageUrl = url ? getAbsoluteUrl(url) : SEO_CONFIG.siteUrl;
  const canonicalUrl = canonical ? getCanonicalUrl(canonical) : pageUrl;

  // Robots meta
  const robotsContent = [
    noindex ? "noindex" : "index",
    nofollow ? "nofollow" : "follow",
  ].join(", ");

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <meta name="author" content={author || SEO_CONFIG.author} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content={SEO_CONFIG.siteName} />
      <meta property="og:locale" content={SEO_CONFIG.locale} />
      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {author && <meta property="article:author" content={author} />}
      {SEO_CONFIG.facebookAppId && (
        <meta property="fb:app_id" content={SEO_CONFIG.facebookAppId} />
      )}
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      {SEO_CONFIG.twitterHandle && (
        <meta name="twitter:site" content={`@${SEO_CONFIG.twitterHandle}`} />
      )}
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#f97316" /> {/* Orange-500 */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(structuredData) ? structuredData : [structuredData],
          )}
        </script>
      )}
    </Helmet>
  );
};
