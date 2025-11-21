Create React email verification flow with JWT authentication where:

1. Unverified users (verified: false) are redirected to /verify-email page after login

2. Users cannot access dashboard until email is verified

3. Include AuthGuard component that checks JWT token + user.verified status

4. Create useAuth hook that manages JWT tokens in localStorage

5. Add axios interceptors for automatic token attachment and 401 refresh handling

6. ProtectedRoute component validates JWT + verification status

7. Show loading states during token validation

8. Redirect verified users away from /verify-email to dashboard

9. Handle token expiry and auto-logout on invalid tokens
