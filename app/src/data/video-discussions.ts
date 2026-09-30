import { formatTimeAgo, getInitialsOf } from "@/data/discussions";

export type VideoComment = {
  id: string;
  videoId: string;
  author: string;
  authorTitle: string;
  body: string;
  postedAt: string;
  upvotes: number;
  fromInstructor?: boolean;
  pinned?: boolean;
};

const AUTHORS: { name: string; title: string }[] = [
  { name: "Nadia Haddad", title: "Learner" },
  { name: "Tomás Rivera", title: "Learner" },
  { name: "Grace Lin", title: "Mentor" },
  { name: "Omar Farouk", title: "Learner" },
  { name: "Elena Petrova", title: "Learner" },
  { name: "Kwame Mensah", title: "Mentor" },
  { name: "Yuki Tanaka", title: "Learner" },
  { name: "Rosa Iglesias", title: "Learner" },
  { name: "Ben Achterberg", title: "Learner" },
  { name: "Amara Nwosu", title: "Mentor" },
  { name: "Lucas Ferrari", title: "Learner" },
  { name: "Hana Novak", title: "Learner" },
  { name: "Diego Salazar", title: "Learner" },
  { name: "Ingrid Berg", title: "Mentor" },
];

const BODIES: string[] = [
  "The section on profiling saved me an entire afternoon. I had been guessing where the time went instead of measuring it.",
  "Small correction that might help others: the flag only takes effect after you reload the config, not on the next request.",
  "Would love a follow-up going deeper into the failure modes you mentioned near the end.",
  "I followed along in a fresh project and it worked first try. The setup steps are finally accurate.",
  "This is the third resource I've tried on this and the first one where the tradeoffs were actually spelled out.",
  "That gotcha bit me too. Took me a while to realise the value was being read once at startup.",
  "Bookmarked. This is going into the onboarding doc I send to every new joiner on the team.",
  "The benchmarks at the halfway mark surprised me. I assumed the overhead would be worse than that.",
  "Is there a reason to prefer the manual approach over the automated one for small projects?",
  "Came here from the channel's shorter clip and this filled in a lot of gaps.",
  "Genuinely one of the clearest explanations of this I have read anywhere. Thank you for taking the time.",
  "The example repo has a branch for the optimised version, which made the diff easy to follow.",
  "Does this approach hold up once you have more than a handful of services talking to each other?",
  "I tried the alternative first and hit the exact wall you describe at four minutes in.",
];

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const ANCHOR = Date.now();

function hash(value: string): number {
  let acc = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    acc ^= value.charCodeAt(index);
    acc = Math.imul(acc, 0x01000193) >>> 0;
  }
  acc ^= acc >>> 16;
  acc = Math.imul(acc, 0x7feb352d) >>> 0;
  acc ^= acc >>> 15;
  acc = Math.imul(acc, 0x846ca68b) >>> 0;
  acc ^= acc >>> 16;
  return acc >>> 0;
}

export function getVideoCommentColor(videoId: string, author: string): string {
  const palette = ["#8A5CB8", "#2F7D6E", "#B0563F", "#3B6BA5", "#8A6A24", "#A03C6B"];
  return palette[hash(`${videoId}-${author}`) % palette.length];
}

export function getVideoComments(videoId: string, limit = 6): VideoComment[] {
  const count = 3 + (hash(`${videoId}-thread-count`) % 4);

  return Array.from({ length: Math.min(count, limit) }, (_, index) => {
    const author = AUTHORS[hash(`${videoId}-author-${index}`) % AUTHORS.length];
    const spread = 18 * DAY;
    const jitter = hash(`${videoId}-age-${index}`) % spread;
    const age = 8 * MINUTE + Math.floor((jitter * jitter) / spread);
    const pinned = index === 0;

    return {
      id: `${videoId}-comment-${index + 1}`,
      videoId,
      author: author.name,
      authorTitle: author.title,
      body: BODIES[hash(`${videoId}-body-${index}`) % BODIES.length],
      postedAt: new Date(ANCHOR - age).toISOString(),
      upvotes:
        (pinned ? 180 : 2) + (hash(`${videoId}-upvotes-${index}`) % (pinned ? 420 : 140)),
      pinned,
    };
  });
}

export function makeVideoComment(
  videoId: string,
  author: string,
  body: string,
): VideoComment {
  return {
    id: `${videoId}-posted-${Date.now()}`,
    videoId,
    author,
    authorTitle: "You",
    body,
    postedAt: new Date(ANCHOR).toISOString(),
    upvotes: 0,
  };
}

export { formatTimeAgo, getInitialsOf };
