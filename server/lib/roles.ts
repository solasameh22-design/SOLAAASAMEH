export const ROLES = ['tourist', 'tour_guide', 'trip_planner'] as const;
export type Role = (typeof ROLES)[number];
