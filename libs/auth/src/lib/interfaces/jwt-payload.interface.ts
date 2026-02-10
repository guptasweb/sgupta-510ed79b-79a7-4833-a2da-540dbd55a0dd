export interface JwtPayload {
  userId: string;
  email: string;
  roleId: string;
  organizationId: string;
  /** Issued-at time (seconds since epoch). */
  iat?: number;
  /** Expiration time (seconds since epoch). */
  exp?: number;
}
