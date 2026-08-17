import React from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://terrysauto.shop';
const HOME_TITLE = "Terry's Auto Service | Auto Repair & Maintenance";
const HOME_DESCRIPTION = "Appointment-based auto repair and maintenance from Terry's Auto Service, including diagnostics, brakes, oil changes, suspension, steering, and vehicle inspections.";

const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

const SeoManager: React.FC = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    const isHome = pathname === '/';
    const title = isHome ? HOME_TITLE : `Account | Terry's Auto Service`;
    const description = isHome
      ? HOME_DESCRIPTION
      : "Secure customer and staff area for Terry's Auto Service.";
    const canonicalUrl = isHome ? `${SITE_URL}/` : `${SITE_URL}${pathname}`;
    const robots = isHome ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';

    document.title = title;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[name="robots"]', 'name', 'robots', robots);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [pathname]);

  return null;
};

export default SeoManager;
