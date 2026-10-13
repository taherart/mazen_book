import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

// Member and admin screens hold nothing worth indexing; they are also marked noindex.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/login", "/signup"] }],
    host: SITE.url,
  };
}
