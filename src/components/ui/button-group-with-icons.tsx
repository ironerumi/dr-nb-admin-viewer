"use client";

import { Button } from "./button";
import { ButtonGroup } from "./button-group";
import { Copy, Download } from "lucide-react";

function ButtonGroupDemo() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-4">
      <div className="space-y-3">
        <ButtonGroup size="sm">
          <Button variant="outline">
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}

export { ButtonGroupDemo };


