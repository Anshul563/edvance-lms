export type DiscussionReply = {
  id: string;
  author: string;
  authorTitle: string;
  body: string;
  postedAt: string;
  upvotes: number;
  fromInstructor?: boolean;
};

export type Discussion = {
  id: string;
  lessonId: string;
  author: string;
  authorTitle: string;
  title: string;
  body: string;
  postedAt: string;
  upvotes: number;
  replies: DiscussionReply[];
  pinned?: boolean;
  resolved?: boolean;
};

const THREADS: Discussion[] = [
  {
    id: "thread-1",
    lessonId: "lesson-1",
    author: "Priya Raman",
    authorTitle: "Learner",
    title: "Why does the closure capture the loop variable by reference?",
    body: "The example at 4:12 says the callback logs 1, 2, 3 instead of 3, 3, 3. Is that JS or is it specific to how we compile this?",
    postedAt: "2026-09-24T09:12:00.000Z",
    upvotes: 42,
    pinned: true,
    resolved: true,
    replies: [
      {
        id: "reply-1",
        author: "Meera Iyer",
        authorTitle: "Instructor",
        body: "That is the language itself. `var` is function scoped, so all three closures share one binding. Swap it for `let` and each iteration gets its own.",
        postedAt: "2026-09-24T11:40:00.000Z",
        upvotes: 128,
        fromInstructor: true,
      },
      {
        id: "reply-2",
        author: "Dan Okafor",
        authorTitle: "Learner",
        body: "The `let` version is what finally made it click for me. Adding a link to the MDN page here for anyone else stuck.",
        postedAt: "2026-09-25T08:05:00.000Z",
        upvotes: 17,
      },
    ],
  },
  {
    id: "thread-2",
    lessonId: "lesson-1",
    author: "Tomas Beck",
    authorTitle: "Learner",
    title: "Is this pattern still used in production React?",
    body: "You mentioned avoiding it in effects. What do you reach for now when a subscription needs to resubscribe on prop change?",
    postedAt: "2026-09-26T16:22:00.000Z",
    upvotes: 23,
    replies: [
      {
        id: "reply-3",
        author: "Meera Iyer",
        authorTitle: "Instructor",
        body: "Mostly an event with a stable handler, or an external store you subscribe to once. I walk through both in the follow-up lesson.",
        postedAt: "2026-09-27T07:15:00.000Z",
        upvotes: 64,
        fromInstructor: true,
      },
    ],
  },
  {
    id: "thread-3",
    lessonId: "lesson-1",
    author: "Anita Desai",
    authorTitle: "Learner",
    title: "Nit: the naming on slide 7 is inconsistent",
    body: "The variable is called `handlePress` in one snippet and `onPressHandler` in the next. Just flagging in case the slides get reused.",
    postedAt: "2026-09-28T13:47:00.000Z",
    upvotes: 8,
    resolved: true,
    replies: [],
  },
  {
    id: "thread-4",
    lessonId: "lesson-2",
    author: "Luis Moreno",
    authorTitle: "Learner",
    title: "How long should I spend on the exercises?",
    body: "Finished the first exercise in about ten minutes but got stuck on the second for a while. Is that normal for this module?",
    postedAt: "2026-09-23T10:02:00.000Z",
    upvotes: 15,
    replies: [
      {
        id: "reply-4",
        author: "Sara Lindqvist",
        authorTitle: "Mentor",
        body: "Completely normal. The second one is the one that is meant to take the evening.",
        postedAt: "2026-09-23T18:30:00.000Z",
        upvotes: 31,
      },
    ],
  },
  {
    id: "thread-5",
    lessonId: "lesson-3",
    author: "Chen Wei",
    authorTitle: "Learner",
    title: "Are the timings in the transcript accurate?",
    body: "The transcript jumps from 12:04 to 12:31 with no captions in between. Seems like a couple of seconds are missing.",
    postedAt: "2026-09-27T05:19:00.000Z",
    upvotes: 6,
    replies: [],
  },
];

const MINUTES = 60_000;
const HOURS = 60 * MINUTES;
const DAYS = 24 * HOURS;
const WEEKS = 7 * DAYS;

export function getInitialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function formatTimeAgo(value: string, now: number = Date.now()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const elapsed = Math.max(0, now - date.getTime());

  if (elapsed < HOURS) {
    const minutes = Math.max(1, Math.floor(elapsed / MINUTES));
    return `${minutes}m ago`;
  }
  if (elapsed < DAYS) {
    const hours = Math.floor(elapsed / HOURS);
    return `${hours}h ago`;
  }
  if (elapsed < WEEKS) {
    const days = Math.floor(elapsed / DAYS);
    return `${days}d ago`;
  }
  if (elapsed < 52 * WEEKS) {
    const weeks = Math.floor(elapsed / WEEKS);
    return `${weeks}w ago`;
  }

  return `${Math.floor(elapsed / (52 * WEEKS))}y ago`;
}

export function getLessonDiscussions(lessonId: string): Discussion[] {
  return THREADS.filter((thread) => thread.lessonId === lessonId);
}

export function countReplies(threads: Discussion[]): number {
  return threads.reduce((total, thread) => total + thread.replies.length, 0);
}
