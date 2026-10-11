import { cacheLife } from "next/cache";
import { weekAt } from "../week";

/** The active week, shared by every visitor and refreshed hourly. With a backend this becomes
 *  the admin's "challenge of the week" record. */
export async function getCurrentWeek() {
  "use cache";
  cacheLife("hours");
  return weekAt(new Date());
}
