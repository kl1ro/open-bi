export default interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export type UserForm = Omit<User, "id" | "createdAt">;

export function convertUserToView(user: User) {
  return { id: user.id, email: user.email };
}

export type UserView = ReturnType<typeof convertUserToView>;
