import { Suspense } from "react";
import PartnerSignIn from "./PartnerSignIn";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PartnerSignIn />
    </Suspense>
  );
}
