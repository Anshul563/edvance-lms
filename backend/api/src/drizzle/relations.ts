//? Relation graph, kept in one file so the full object graph reads top to
//? bottom and no schema file needs to import its children. Splitting relations
//? across schema files creates circular imports, since a child table's relation
//? must reference the parent table object.

import { relations } from "drizzle-orm";

import { channelsTable } from "./schemas/channel.schema";
import { lessonPostersTable } from "./schemas/lesson.schema";
import {
  enrollmentsTable,
  lessonProgressTable,
  ordersTable
} from "./schemas/commerce.schema";
import { coursesTable } from "./schemas/course.schema";
import { creatorVideosTable } from "./schemas/creator-videos.schema";
import {
  discussionRepliesTable,
  discussionThreadsTable,
  discussionVotesTable
} from "./schemas/discussions.schema";
import {
  courseReviewsTable,
  subscriptionsTable,
  videoReactionsTable,
  wishlistTable
} from "./schemas/engagement.schema";
import {
  achievementsTable,
  certificatesTable,
  learningActivityTable,
  userAchievementsTable
} from "./schemas/gamification.schema";
import {
  searchHistoryTable,
  videoWatchHistoryTable
} from "./schemas/history.schema";
import { notificationsTable } from "./schemas/notifications.schema";
import { lessonsTable } from "./schemas/lesson.schema";
import { userRoleGrantsTable, usersTable } from "./schemas/user.schema";
import {
  lessonVideosTable,
  uploadSessionsTable,
  videoRenditionsTable
} from "./schemas/video.schema";

//? Two relations join role_grants back to users (grantee and granter), so both
//? sides carry an explicit relationName. Without it the graph is ambiguous and
//? drizzle-kit reports a duplicate-relation error.
export const usersRelations = relations(usersTable, ({ many }) => ({
  roleGrants: many(userRoleGrantsTable, { relationName: "grantee" }),
  grantedRoleGrants: many(userRoleGrantsTable, { relationName: "granter" }),
  channels: many(channelsTable),
  courses: many(coursesTable),
  enrollments: many(enrollmentsTable),
  orders: many(ordersTable),
  lessonProgress: many(lessonProgressTable),
  subscriptions: many(subscriptionsTable),
  videoReactions: many(videoReactionsTable),
  courseReviews: many(courseReviewsTable),
  wishlist: many(wishlistTable),
  watchHistory: many(videoWatchHistoryTable),
  searchHistory: many(searchHistoryTable),
  achievements: many(userAchievementsTable),
  certificates: many(certificatesTable),
  learningActivity: many(learningActivityTable),
  notifications: many(notificationsTable),
  threads: many(discussionThreadsTable),
  replies: many(discussionRepliesTable),
  votes: many(discussionVotesTable)
}));

export const userRoleGrantsRelations = relations(
  userRoleGrantsTable,
  ({ one }) => ({
    user: one(usersTable, {
      relationName: "grantee",
      fields: [userRoleGrantsTable.userId],
      references: [usersTable.id]
    }),
    grantedByUser: one(usersTable, {
      relationName: "granter",
      fields: [userRoleGrantsTable.grantedBy],
      references: [usersTable.id]
    })
  })
);

export const channelsRelations = relations(channelsTable, ({ one, many }) => ({
  owner: one(usersTable, {
    fields: [channelsTable.ownerId],
    references: [usersTable.id]
  }),
  courses: many(coursesTable),
  creatorVideos: many(creatorVideosTable),
  subscriptions: many(subscriptionsTable)
}));

export const creatorVideosRelations = relations(
  creatorVideosTable,
  ({ one, many }) => ({
    channel: one(channelsTable, {
      fields: [creatorVideosTable.channelId],
      references: [channelsTable.id]
    }),
    reactions: many(videoReactionsTable),
    watchHistory: many(videoWatchHistoryTable),
    threads: many(discussionThreadsTable)
  })
);

export const coursesRelations = relations(coursesTable, ({ one, many }) => ({
  channel: one(channelsTable, {
    fields: [coursesTable.channelId],
    references: [channelsTable.id]
  }),
  author: one(usersTable, {
    fields: [coursesTable.authorId],
    references: [usersTable.id]
  }),
  lessons: many(lessonsTable),
  enrollments: many(enrollmentsTable),
  orders: many(ordersTable),
  reviews: many(courseReviewsTable),
  wishlist: many(wishlistTable),
  certificates: many(certificatesTable)
}));

export const lessonsRelations = relations(lessonsTable, ({ one, many }) => ({
  course: one(coursesTable, {
    fields: [lessonsTable.courseId],
    references: [coursesTable.id]
  }),
  progress: many(lessonProgressTable),
  poster: one(lessonPostersTable),
  video: one(lessonVideosTable),
  uploadSessions: many(uploadSessionsTable),
  threads: many(discussionThreadsTable)
}));

export const lessonPostersRelations = relations(
  lessonPostersTable,
  ({ one }) => ({
    lesson: one(lessonsTable, {
      fields: [lessonPostersTable.lessonId],
      references: [lessonsTable.id]
    })
  })
);

export const lessonVideosRelations = relations(
  lessonVideosTable,
  ({ one, many }) => ({
    lesson: one(lessonsTable, {
      fields: [lessonVideosTable.lessonId],
      references: [lessonsTable.id]
    }),
    renditions: many(videoRenditionsTable)
  })
);

export const videoRenditionsRelations = relations(
  videoRenditionsTable,
  ({ one }) => ({
    lessonVideo: one(lessonVideosTable, {
      fields: [videoRenditionsTable.lessonVideoId],
      references: [lessonVideosTable.lessonId]
    })
  })
);

export const uploadSessionsRelations = relations(
  uploadSessionsTable,
  ({ one }) => ({
    lesson: one(lessonsTable, {
      fields: [uploadSessionsTable.lessonId],
      references: [lessonsTable.id]
    })
  })
);

export const enrollmentsRelations = relations(enrollmentsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [enrollmentsTable.userId],
    references: [usersTable.id]
  }),
  course: one(coursesTable, {
    fields: [enrollmentsTable.courseId],
    references: [coursesTable.id]
  })
}));

export const ordersRelations = relations(ordersTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [ordersTable.userId],
    references: [usersTable.id]
  }),
  course: one(coursesTable, {
    fields: [ordersTable.courseId],
    references: [coursesTable.id]
  })
}));

export const lessonProgressRelations = relations(
  lessonProgressTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [lessonProgressTable.userId],
      references: [usersTable.id]
    }),
    lesson: one(lessonsTable, {
      fields: [lessonProgressTable.lessonId],
      references: [lessonsTable.id]
    })
  })
);

export const videoReactionsRelations = relations(
  videoReactionsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [videoReactionsTable.userId],
      references: [usersTable.id]
    }),
    video: one(creatorVideosTable, {
      fields: [videoReactionsTable.videoId],
      references: [creatorVideosTable.id]
    })
  })
);

export const subscriptionsRelations = relations(
  subscriptionsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [subscriptionsTable.userId],
      references: [usersTable.id]
    }),
    channel: one(channelsTable, {
      fields: [subscriptionsTable.channelId],
      references: [channelsTable.id]
    })
  })
);

export const courseReviewsRelations = relations(
  courseReviewsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [courseReviewsTable.userId],
      references: [usersTable.id]
    }),
    course: one(coursesTable, {
      fields: [courseReviewsTable.courseId],
      references: [coursesTable.id]
    })
  })
);

export const wishlistRelations = relations(wishlistTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [wishlistTable.userId],
    references: [usersTable.id]
  }),
  course: one(coursesTable, {
    fields: [wishlistTable.courseId],
    references: [coursesTable.id]
  })
}));

export const discussionThreadsRelations = relations(
  discussionThreadsTable,
  ({ one, many }) => ({
    author: one(usersTable, {
      fields: [discussionThreadsTable.authorId],
      references: [usersTable.id]
    }),
    lesson: one(lessonsTable, {
      fields: [discussionThreadsTable.lessonId],
      references: [lessonsTable.id]
    }),
    video: one(creatorVideosTable, {
      fields: [discussionThreadsTable.videoId],
      references: [creatorVideosTable.id]
    }),
    replies: many(discussionRepliesTable),
    votes: many(discussionVotesTable)
  })
);

export const discussionRepliesRelations = relations(
  discussionRepliesTable,
  ({ one, many }) => ({
    thread: one(discussionThreadsTable, {
      fields: [discussionRepliesTable.threadId],
      references: [discussionThreadsTable.id]
    }),
    author: one(usersTable, {
      fields: [discussionRepliesTable.authorId],
      references: [usersTable.id]
    }),
    votes: many(discussionVotesTable)
  })
);

export const discussionVotesRelations = relations(
  discussionVotesTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [discussionVotesTable.userId],
      references: [usersTable.id]
    }),
    thread: one(discussionThreadsTable, {
      fields: [discussionVotesTable.threadId],
      references: [discussionThreadsTable.id]
    }),
    reply: one(discussionRepliesTable, {
      fields: [discussionVotesTable.replyId],
      references: [discussionRepliesTable.id]
    })
  })
);

export const videoWatchHistoryRelations = relations(
  videoWatchHistoryTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [videoWatchHistoryTable.userId],
      references: [usersTable.id]
    }),
    video: one(creatorVideosTable, {
      fields: [videoWatchHistoryTable.videoId],
      references: [creatorVideosTable.id]
    })
  })
);

export const searchHistoryRelations = relations(
  searchHistoryTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [searchHistoryTable.userId],
      references: [usersTable.id]
    })
  })
);

export const achievementsRelations = relations(
  achievementsTable,
  ({ many }) => ({
    earners: many(userAchievementsTable)
  })
);

export const userAchievementsRelations = relations(
  userAchievementsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userAchievementsTable.userId],
      references: [usersTable.id]
    }),
    achievement: one(achievementsTable, {
      fields: [userAchievementsTable.achievementId],
      references: [achievementsTable.id]
    })
  })
);

export const certificatesRelations = relations(
  certificatesTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [certificatesTable.userId],
      references: [usersTable.id]
    }),
    course: one(coursesTable, {
      fields: [certificatesTable.courseId],
      references: [coursesTable.id]
    })
  })
);

export const learningActivityRelations = relations(
  learningActivityTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [learningActivityTable.userId],
      references: [usersTable.id]
    })
  })
);

export const notificationsRelations = relations(
  notificationsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [notificationsTable.userId],
      references: [usersTable.id]
    })
  })
);
