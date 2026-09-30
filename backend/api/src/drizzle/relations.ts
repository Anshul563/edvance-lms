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
  lessonProgress: many(lessonProgressTable)
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
  courses: many(coursesTable)
}));

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
  orders: many(ordersTable)
}));

export const lessonsRelations = relations(lessonsTable, ({ one, many }) => ({
  course: one(coursesTable, {
    fields: [lessonsTable.courseId],
    references: [coursesTable.id]
  }),
  progress: many(lessonProgressTable),
  poster: one(lessonPostersTable),
  video: one(lessonVideosTable),
  uploadSessions: many(uploadSessionsTable)
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
