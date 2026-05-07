import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isScanRoute = createRouteMatcher(["/scan(.*)"]);
const isVerifyRoute = createRouteMatcher(["/api/tickets/verify(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req) || isScanRoute(req) || isVerifyRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
