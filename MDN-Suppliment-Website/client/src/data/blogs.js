import isolateCover from "../assets/mdn-isolate-whey-2400x1200.jpg";
import disciplineCover from "../assets/mdn-discipline-whey-2400x1200.png";
import shilajitCover from "../assets/mdn-shilajit-2400x1200.jpeg";
import maxResultsCover from "../assets/mdn-maximum-results-2400x1200.jpg";

// Static editorial content — no backend model. Edit this array to add,
// remove, or rewrite posts; the list page and detail page both read
// straight from here. `content` is a list of simple blocks so BlogDetail
// can render headings and paragraphs without needing a markdown parser.
export const BLOGS = [
  {
    slug: "whey-concentrate-vs-isolate",
    title: "Whey Concentrate vs. Isolate: Which One Actually Fits Your Goals?",
    category: "Nutrition",
    cover: isolateCover,
    date: "2026-06-02",
    readTime: "5 min read",
    excerpt:
      "Both build muscle. The difference is in the label most people never read — protein-per-scoop, lactose content, and how fast it actually digests.",
    content: [
      {
        type: "p",
        text:
          "Every gym conversation eventually lands here: concentrate or isolate? The honest answer is that both work — the difference is in the fine print most people skip.",
      },
      { type: "h2", text: "What's actually different" },
      {
        type: "p",
        text:
          "Concentrate keeps a small amount of lactose and fat from the milk it's derived from, which is why it usually tastes creamier and costs less per gram of protein. Isolate goes through extra filtering to strip most of that out, landing at 90%+ protein by weight with barely any carbs or fat.",
      },
      {
        type: "p",
        text:
          "That filtering is also why isolate tends to sit easier if you're lactose-sensitive — there's simply less lactose left for your gut to deal with.",
      },
      { type: "h2", text: "Which one should you buy" },
      {
        type: "p",
        text:
          "If you're counting macros tightly, cutting, or your stomach doesn't love dairy, isolate is worth the extra cost. If your main goal is just hitting your daily protein number without overthinking it, a good concentrate does the exact same job for less money.",
      },
      {
        type: "p",
        text:
          "Either way, check the label for actual grams of protein per scoop, not just the marketing on the front of the tub — that's the number that decides how many scoops you really need.",
      },
    ],
  },
  {
    slug: "discipline-whey-daily-habit",
    title: "Discipline Whey: How to Turn Protein Into a Daily Habit, Not a Chore",
    category: "Lifestyle",
    cover: disciplineCover,
    date: "2026-05-18",
    readTime: "4 min read",
    excerpt:
      "Consistency beats a perfect formula every time. Here's how to build a protein routine you'll still be following in a year, not a week.",
    content: [
      {
        type: "p",
        text:
          "Most people don't fall off their protein goals because of a bad formula — they fall off because the routine was never built to survive a busy week in the first place.",
      },
      { type: "h2", text: "Anchor it to something you already do" },
      {
        type: "p",
        text:
          "Don't rely on remembering. Stack your shake onto an existing habit — right after you brush your teeth, right when you get home from the gym, right before you make coffee. The habit needs a trigger, not willpower.",
      },
      { type: "h2", text: "Keep the friction near zero" },
      {
        type: "p",
        text:
          "Pre-portion scoops into a shaker the night before, or keep a tub at your desk instead of only at home. The version of your routine that survives isn't the optimal one — it's the one that takes fifteen seconds to start.",
      },
      {
        type: "p",
        text:
          "That's the whole idea behind Discipline Whey — a straightforward formula built to be the easy part of your day, so the only thing left to manage is showing up.",
      },
    ],
  },
  {
    slug: "shilajit-101",
    title: "Shilajit 101: What It Is, What It Isn't, and Who Should Take It",
    category: "Wellness",
    cover: shilajitCover,
    date: "2026-05-04",
    readTime: "6 min read",
    excerpt:
      "It's not a magic mineral tar. Here's a grounded look at what shilajit actually contains and why athletes have started adding it alongside their protein.",
    content: [
      {
        type: "p",
        text:
          "Shilajit gets thrown around with a lot of big claims attached to it. Strip away the hype and it's a mineral-rich resin, formed over centuries in mountain rock, that's been used in traditional medicine for a long time before it showed up in supplement aisles.",
      },
      { type: "h2", text: "What's actually in it" },
      {
        type: "p",
        text:
          "The headline compound is fulvic acid, alongside a broad spread of trace minerals. Researchers are still working out exactly how much of its traditional reputation holds up under modern study, but the mineral profile itself is well documented.",
      },
      { type: "h2", text: "Why athletes add it" },
      {
        type: "p",
        text:
          "It's typically taken for general energy and recovery support alongside training — not as a replacement for protein, sleep, or a solid diet, but as one more piece of a routine that's already dialed in.",
      },
      {
        type: "p",
        text:
          "Purity matters more here than with almost any other supplement category — look for lab-tested, purified shilajit specifically, since the raw resin can vary a lot in quality depending on where and how it's sourced.",
      },
    ],
  },
  {
    slug: "bulking-without-the-bloat",
    title: "Bulking Without the Bloat: Getting the Most Out of a Mass Gainer",
    category: "Nutrition",
    cover: maxResultsCover,
    date: "2026-04-21",
    readTime: "5 min read",
    excerpt:
      "A gainer is a calorie tool, not a free pass. Here's how to use one to build muscle without waking up puffy and out of breath on the stairs.",
    content: [
      {
        type: "p",
        text:
          "A mass gainer's entire job is to make hitting a calorie surplus easier when food alone isn't cutting it. The problem is most people treat it as a second dinner instead of a tool, and end up gaining a lot more fat than muscle.",
      },
      { type: "h2", text: "Dose it around your actual gap" },
      {
        type: "p",
        text:
          "Work out roughly how far your normal eating falls short of your surplus target, then use the gainer to close that gap — not stack on top of an already-sufficient day. Half a scoop can be plenty on a day you ate well.",
      },
      { type: "h2", text: "Time it where it helps most" },
      {
        type: "p",
        text:
          "Post-workout and before bed are the two windows where the extra calories and protein tend to do the most work, since your body is already primed to use them for recovery rather than store them.",
      },
      {
        type: "p",
        text:
          "Track your waistline, not just the scale. If it's climbing fast, that's your gainer telling you the dose is bigger than your training currently needs.",
      },
    ],
  },
];

export function getBlogBySlug(slug) {
  return BLOGS.find((b) => b.slug === slug);
}
