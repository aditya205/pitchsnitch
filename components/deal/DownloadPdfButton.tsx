"use client";

import { Button } from "@/components/ui/Button";

export function DownloadPdfButton({ dealId }: { dealId: string }) {
  function handleDownload() {
    window.location.assign(`/deal/${dealId}/pdf`);
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleDownload}>
      Download PDF
    </Button>
  );
}
