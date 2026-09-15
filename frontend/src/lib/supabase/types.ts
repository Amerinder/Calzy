export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type HealthGoal = "lose" | "maintain" | "gain";

export type Gender = "male" | "female" | "other";

export interface UserProfile {
  user_id: string;
  email: string | null;
  name: string | null;
  age: number | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel | null;
  goal: HealthGoal | null;
  created_at: string;
  updated_at: string;
}
