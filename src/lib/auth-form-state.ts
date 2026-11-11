export type AuthError =
  | "invalid_fields"
  | "invalid_credentials"
  | "registration_failed"
  | "rate_limited"
  | "unavailable"
  | "invalid_origin";

export interface AuthFormState {
  error: AuthError | null;
}
