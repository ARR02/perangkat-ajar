export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/schools/:path*",
    "/documents/:path*",
    "/templates/:path*",
  ],
};