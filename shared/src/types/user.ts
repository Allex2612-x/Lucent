export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  currency: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
