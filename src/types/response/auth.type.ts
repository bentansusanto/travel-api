export class AuthResponse {
  message: string;
  data?: {
    id: string;
    name: string;
    email: string;
    is_verified: boolean;
    role_id: string;
    role?: {
      id: string;
      name: string;
      code: string
    }
    session?: string;
  };
}
