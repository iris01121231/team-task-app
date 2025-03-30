"use client";

import { Suspense } from "react";
import ClientPage from "./client-page";

export default function Page() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <ClientPage />
    </Suspense>
  );
}
