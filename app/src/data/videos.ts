import { SAMPLE_VIDEOS } from "@/data/courses";
import type { VideoVariant } from "@/types/course";
import type { StandaloneVideo } from "@/types/instructor";

const SAMPLE_VIDEO_NAMES = ["bunny", "cat", "corgi", "test"];
const DEFAULT_VARIANT: VideoVariant = "720p";

type StandaloneSeed = {
  channelId: string;
  title: string;
  description: string;
  durationMinutes: number;
  publishedAt: string;
};

const SEEDS: StandaloneSeed[] = [
  {
    channelId: "maya-chen",
    title: "Why your FlatList stutters at 200 rows",
    description:
      "Profiling a real feed that dropped frames the moment we added avatars. We walk through the three causes that showed up in almost every audit, and the one-line change that fixed the worst offender.",
    durationMinutes: 14,
    publishedAt: "August 2026",
  },
  {
    channelId: "maya-chen",
    title: "Expo Router file-based routing in 20 minutes",
    description:
      "No theory. We build a three-tab app with dynamic routes, typed params and a not-found screen, then break it on purpose so you see how the failure modes behave.",
    durationMinutes: 21,
    publishedAt: "July 2026",
  },
  {
    channelId: "maya-chen",
    title: "Reading a flame graph like a detective",
    description:
      "Screenshots of real traces where the expensive thing was not where I expected. A repeatable method for going from a dropped frame to a specific line of code.",
    durationMinutes: 17,
    publishedAt: "June 2026",
  },
  {
    channelId: "maya-chen",
    title: "Five animation mistakes I review every week",
    description:
      "Driving animations off the JS thread, animating layout instead of transforms, ignoring reduced-motion. Five clips from actual code review with the fix after each one.",
    durationMinutes: 12,
    publishedAt: "May 2026",
  },
  {
    channelId: "maya-chen",
    title: "TypeScript patterns for React Native refs",
    description:
      "Typed refs, imperative handles, and the generic trick that stops useRef from defaulting to null everywhere. Written with strict mode on the whole time.",
    durationMinutes: 16,
    publishedAt: "April 2026",
  },
  {
    channelId: "diego-alvarez",
    title: "From Figma variables to real design tokens",
    description:
      "The export pipeline nobody documents: modes, aliases, and the naming convention that kept 200 components from drifting apart over two years.",
    durationMinutes: 19,
    publishedAt: "August 2026",
  },
  {
    channelId: "diego-alvarez",
    title: "Accessible focus rings that designers stop removing",
    description:
      "How to make a focus style that is visible on every background, passes contrast, and still looks deliberate in a design review.",
    durationMinutes: 11,
    publishedAt: "July 2026",
  },
  {
    channelId: "diego-alvarez",
    title: "Motion that respects prefers-reduced-motion",
    description:
      "One media query, three tiers of fallback, and the component wrapper we now require for any animated UI. Includes the reduced-motion demo everyone should copy.",
    durationMinutes: 13,
    publishedAt: "June 2026",
  },
  {
    channelId: "diego-alvarez",
    title: "Shipping a component library without a rebuild crisis",
    description:
      "Versioning, changelogs, and the deprecation process that let us ship 40 breaking changes in a year without freezing feature work.",
    durationMinutes: 24,
    publishedAt: "May 2026",
  },
  {
    channelId: "priya-nair",
    title: "Make illegal states unrepresentable",
    description:
      "A refactor that deleted 300 lines of runtime validation by changing four types. We start from the bug and work backwards to the shape that prevents it.",
    durationMinutes: 18,
    publishedAt: "August 2026",
  },
  {
    channelId: "priya-nair",
    title: "Monorepo boundaries that survive a reorg",
    description:
      "Package boundaries, dependency rules enforced in CI, and why ownership belongs in the build config rather than a wiki page.",
    durationMinutes: 22,
    publishedAt: "July 2026",
  },
  {
    channelId: "priya-nair",
    title: "Type-level tests with no test framework",
    description:
      "Using the compiler as the assertion layer. Expect/expectTypeOf from the type system itself, with failure messages people can actually read.",
    durationMinutes: 15,
    publishedAt: "June 2026",
  },
  {
    channelId: "priya-nair",
    title: "Designing a public API you will not regret",
    description:
      "Naming, argument objects versus positional parameters, error contracts, and the deprecation story you have to design on day one.",
    durationMinutes: 26,
    publishedAt: "May 2026",
  },
  {
    channelId: "sofia-rossi",
    title: "Your A/B test is lying to you",
    description:
      "Peeking, stopping rules, and the minimum sample size people skip and then pay for. A walkthrough of a real test that shipped the wrong feature.",
    durationMinutes: 20,
    publishedAt: "August 2026",
  },
  {
    channelId: "sofia-rossi",
    title: "The one dashboard every product team needs",
    description:
      "Not forty charts. One funnel, one retention curve, one segment table, and the questions each one is supposed to answer.",
    durationMinutes: 16,
    publishedAt: "July 2026",
  },
  {
    channelId: "sofia-rossi",
    title: "Retention curves that explain themselves",
    description:
      "Reading the drop-off point instead of arguing about the average, plus the cohort definition mistakes that make curves look better than reality.",
    durationMinutes: 13,
    publishedAt: "June 2026",
  },
  {
    channelId: "sofia-rossi",
    title: "Instrumentation events analysts will thank you for",
    description:
      "Property naming, event granularity, and the three fields that make a funnel answerable six months after you ship it.",
    durationMinutes: 18,
    publishedAt: "May 2026",
  },
  {
    channelId: "dr-aaron-blake",
    title: "Data leakage in three subtle disguises",
    description:
      "Target leakage, temporal leakage, and preprocessing done before the split. Each one shown on a model that scored 0.94 and generalized at 0.61.",
    durationMinutes: 23,
    publishedAt: "August 2026",
  },
  {
    channelId: "dr-aaron-blake",
    title: "Evaluating an LLM without fooling yourself",
    description:
      "Building an eval set you did not write, separating capability from formatting, and the failure mode where a model gets better by getting worse.",
    durationMinutes: 27,
    publishedAt: "July 2026",
  },
  {
    channelId: "dr-aaron-blake",
    title: "Your model serves fine and is still wrong",
    description:
      "Monitoring distribution drift, calibration, and the slice metrics that catch a broken model before the support tickets arrive.",
    durationMinutes: 19,
    publishedAt: "June 2026",
  },
  {
    channelId: "dr-aaron-blake",
    title: "Shipping models that survive traffic spikes",
    description:
      "Batching, cold starts, and graceful degradation for inference endpoints. Timings from a production service under a 40x load test.",
    durationMinutes: 21,
    publishedAt: "May 2026",
  },
  {
    channelId: "lena-fischer",
    title: "Why your referral program is not looping",
    description:
      "Most referral mechanics are one-shot with a bonus attached. The structural changes that turn a reward into a self-sustaining loop.",
    durationMinutes: 17,
    publishedAt: "August 2026",
  },
  {
    channelId: "lena-fischer",
    title: "Lifecycle messages that do not annoy people",
    description:
      "Trigger design, frequency caps, and the unsubscribes we engineered on purpose to lower complaints while holding conversion.",
    durationMinutes: 15,
    publishedAt: "July 2026",
  },
  {
    channelId: "lena-fischer",
    title: "Compounding loops versus spike campaigns",
    description:
      "Charting a real year of growth to show which efforts kept producing after the budget stopped. Includes the two we cancelled.",
    durationMinutes: 20,
    publishedAt: "June 2026",
  },
  {
    channelId: "lena-fischer",
    title: "Onboarding friction worth removing",
    description:
      "Running a session-replay review to find the three steps where people quietly left, then measuring what removing each one was actually worth.",
    durationMinutes: 18,
    publishedAt: "April 2026",
  },
];

export function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export const STANDALONE_VIDEOS: StandaloneVideo[] = SEEDS.map((seed, index) => {
  const id = `video-${seed.channelId}-${index + 1}`;
  const variants = SAMPLE_VIDEOS[SAMPLE_VIDEO_NAMES[index % SAMPLE_VIDEO_NAMES.length]];

  return {
    id,
    channelId: seed.channelId,
    title: seed.title,
    description: seed.description,
    thumbnailUrl: `https://picsum.photos/seed/${id}/480/270`,
    videoUrl: variants[DEFAULT_VARIANT],
    videoVariants: variants,
    durationSeconds: seed.durationMinutes * 60,
    views: 1200 + (hashSeed(id) % 88000),
    likes: 40 + (hashSeed(`${id}-likes`) % 4200),
    comments: 3 + (hashSeed(`${id}-comments`) % 320),
    publishedAt: seed.publishedAt,
  };
});

export function getChannelVideoIds(channelId: string): string[] {
  return STANDALONE_VIDEOS.filter((video) => video.channelId === channelId).map(
    (video) => video.id,
  );
}

export function getChannelVideoById(id: string): StandaloneVideo | undefined {
  return STANDALONE_VIDEOS.find((video) => video.id === id);
}
