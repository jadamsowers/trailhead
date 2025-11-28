import { StackClientApp } from "@stackframe/stack";

// Stack Auth configuration
const STACK_PROJECT_ID = import.meta.env.VITE_STACK_PROJECT_ID || "";
const STACK_PUBLISHABLE_CLIENT_KEY = import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY || "";
const STACK_API_URL = import.meta.env.VITE_STACK_API_URL || "http://localhost:8102";

// Create Stack Auth client app
export const stackClientApp = new StackClientApp({
  projectId: STACK_PROJECT_ID,
  publishableClientKey: STACK_PUBLISHABLE_CLIENT_KEY,
  urls: {
    api: STACK_API_URL,
    // Handler routes for authentication pages
    handler: "/handler",
    home: "/",
    afterSignIn: "/family-setup",
    afterSignUp: "/initial-setup",
    signIn: "/login",
    signUp: "/sign-up",
  },
  tokenStore: "cookie",
});
