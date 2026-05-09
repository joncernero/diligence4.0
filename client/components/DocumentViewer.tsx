'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: any;
}

export function DocumentViewer({ open, onOpenChange, document }: DocumentViewerProps) {
  if (!document) return null;

  const isPDF = document.mimeType === 'application/pdf' || document.fileName.toLowerCase().endsWith('.pdf');
  const isImage = document.mimeType?.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{document.documentName}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {document.fileName} • v{document.version}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a href={document.fileUrl} download>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </a>
              <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </a>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 pt-4 overflow-auto max-h-[calc(90vh-120px)]">
          {isPDF ? (
            <iframe
              src={document.fileUrl}
              className="w-full h-[70vh] border rounded"
              title={document.documentName}
            />
          ) : isImage ? (
            <img
              src={document.fileUrl}
              alt={document.documentName}
              className="w-full h-auto rounded border"
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Unable to preview this file type
              </p>
              <a href={document.fileUrl} download>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
