import type { Metadata } from "next";
import { UnlockHub } from "@/components/unlock-hub";
import { getSummaries } from "@/lib/methods";

export const metadata: Metadata = { title: "افتح الطرق", description: "خمس طرق مفتوحة للجميع، والبقية تفتحها خطوة خطوة: استبيان قصير، تحدٍّ، تقييم، تجربة، أو رمز الكتاب." };

export default function UnlockPage() {
  return <UnlockHub methods={getSummaries()} />;
}
