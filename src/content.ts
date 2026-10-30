/**
 * All site copy + which particle shape belongs to each section.
 * Edit text here; no need to touch components.
 *
 * shape keys: pineapple | crown | facebook | instagram | youtube | linkedin |
 *             whatsapp | threads | arrow | globe | mascot | galaxy
 * x / yo: offset as a fraction of half the viewport (-1 left … 1 right)
 * s: scale, spin: rotation speed (0 = face camera), tint: optional colour
 */
export interface ShapeCfg { shape: string; x: number; yo: number; s: number; spin: number; tint?: string }

export const SECTION_SHAPES: Record<string, ShapeCfg[]> = {
  hero: [{ shape: "pineapple", x: 0.42, yo: 0, s: 1, spin: 0.25 }],
  agency: [{ shape: "crown", x: -0.45, yo: 0, s: 1, spin: 0.9 }],
  platforms: [
    { shape: "facebook", x: 0.42, yo: 0, s: 0.9, spin: 0, tint: "#4a8cff" },
    { shape: "instagram", x: 0.42, yo: 0, s: 0.9, spin: 0, tint: "#ff5fa2" },
    { shape: "youtube", x: 0.42, yo: 0, s: 0.9, spin: 0 },
    { shape: "linkedin", x: 0.42, yo: 0, s: 0.9, spin: 0, tint: "#4a8cff" },
    { shape: "whatsapp", x: 0.42, yo: 0, s: 0.9, spin: 0 },
    { shape: "threads", x: 0.42, yo: 0, s: 0.9, spin: 0, tint: "#ff8fc2" },
  ],
  solutions: [{ shape: "arrow", x: 0.45, yo: 0, s: 0.95, spin: 0.15 }],
  expertise: [{ shape: "globe", x: 0.55, yo: 0, s: 1.05, spin: 0.2 }],
  team: [{ shape: "mascot", x: 0.5, yo: 0, s: 1, spin: 0.3 }],
  process: [{ shape: "galaxy", x: 0, yo: 0.1, s: 1.2, spin: 0.15 }],
  contact: [{ shape: "pineapple", x: 0.75, yo: 0.35, s: 0.42, spin: 0.35 }],
};

export const NAV = [
  { label: "Work", href: "#platforms" },
  { label: "Services", href: "#expertise" },
  { label: "Team", href: "#team" },
  { label: "Contact", href: "#contact" },
];

export const PLATFORMS = [
  { name: "Facebook", line: "Community pages and ad funnels that turn scrollers into loyal subjects." },
  { name: "Instagram", line: "Scroll-stopping grids, Reels and Stories with a royal aesthetic." },
  { name: "YouTube", line: "Channel strategy, thumbnails and video that keeps them watching." },
  { name: "LinkedIn", line: "Thought leadership and B2B presence that builds authority." },
  { name: "WhatsApp", line: "Direct broadcast and chat commerce that converts in one tap." },
  { name: "Threads", line: "Witty, timely conversations that keep your brand in the discourse." },
];

export const SOLUTIONS = [
  { t: "Content", d: "Daily posts, Reels, carousels and copy crafted around one clear brand voice." },
  { t: "Ads", d: "Paid campaigns on Meta, YouTube and LinkedIn, tested and scaled for real ROI." },
  { t: "Community", d: "Replies, DMs and moderation that turn followers into a loyal kingdom." },
];

export const SERVICES = [
  {
    t: "Meta Ads",
    d: "Facebook and Instagram campaigns for every goal, shown in the city you choose.",
    items: [
      { k: "Awareness", v: "reach new customers" },
      { k: "Leads", v: "enquiries and WhatsApp contacts" },
      { k: "Sales", v: "direct orders and purchases" },
      { k: "Engagement", v: "likes, comments and shares" },
      { k: "Traffic", v: "visitors to your website or profile" },
      { k: "City targeting", v: "ads in your chosen city" },
    ],
  },
  {
    t: "Google Ads",
    d: "Reach people already searching for your products, near you and beyond.",
    items: [
      { k: "Search & local campaigns", v: "your brand appears when customers search near them" },
      { k: "Google Business Profile", v: "set up and managed, so you show on Google Maps with photos, address and reviews" },
    ],
  },
  {
    t: "AI Creative Content",
    d: "Fresh, on-brand creatives made with AI, without a costly shoot every time.",
    items: [
      { k: "Creative ideas", v: "product photos, reels, posters and ad creatives" },
      { k: "Educational advice", v: "helpful content that teaches customers and builds trust" },
      { k: "Festival posts", v: "ready creatives for every festival and festive offer" },
    ],
  },
  {
    t: "Social Media Marketing",
    d: "Instagram and Facebook handled professionally to grow a loyal following.",
    items: [
      { k: "Consistent posting", v: "posts planned and scheduled, so your page stays active" },
      { k: "Cinematic photography", v: "cinematic-style photos and videos of your collection" },
    ],
  },
  {
    t: "SEO",
    d: "Be found on Google when customers search for you locally.",
    items: [
      { k: "Keywords", v: "we find the words your customers actually search" },
      { k: "Blogs", v: "regular blog content to build your website's ranking" },
      { k: "Visible results", v: "reports showing how your website climbs to the top of Google" },
    ],
  },
];

export const TEAM = [
  {
    name: "Shyam Sodha",
    role: "Founder | Crownaple",
    education: "Completed BBA",
    age: 28,
    photo: "/team/shyam-sodha.png",
  },
  {
    name: "Abhisek Koriya",
    role: "Co-Founder | Crownaple",
    education: "BBA (ongoing)",
    age: 19,
    photo: "/team/abhisek-koriya.png",
  },
  {
    name: "Dhariya Patel",
    role: "Co-Founder | Crownaple",
    education: "Completed MBA",
    age: 24,
    photo: "/team/dhariya-patel.png",
  },
];

export const PROCESS = [
  { t: "Understand", d: "We study your collection, customers, competitors and goals, and decide what to promote first." },
  { t: "Set up", d: "Instagram, Facebook, WhatsApp Business and Google Business Profile set up and polished." },
  { t: "Create", d: "Content for sarees, kids wear and kurtis: product shots, reels, festive creatives and offers." },
  { t: "Promote", d: "Meta Ads and Google Ads running on a budget that suits you, with SEO working in the background." },
  { t: "Measure & improve", d: "Regular reports on reach, enquiries and walk-ins, and we keep improving what works." },
];

export const EMAIL = "crownaple@gmail.com";
export const PHONE = "7788889977";
export const WHATSAPP = "https://wa.me/917788889977";
export const INSTAGRAM = "https://www.instagram.com/crownapleofficial/";
export const INSTAGRAM_HANDLE = "@crownapleofficial";
export const ADDRESS = ["Crownaple Digi Marketing", "Rajkot, Gujarat"];
