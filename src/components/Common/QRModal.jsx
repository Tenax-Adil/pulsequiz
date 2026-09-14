import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ExternalLink, QrCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';

export function QRModal({ isOpen, onClose, roomCode }) {
  const [copied, setCopied] = useState(false);

  if (!roomCode) return null;

  const joinUrl = `${window.location.origin}/?code=${roomCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 mb-2">
            <QrCode className="w-5 h-5 text-zinc-300" />
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight text-center">
            Scan to Join
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-zinc-400">
            Players can point their camera at this QR code to join immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 flex flex-col items-center">
          <div className="p-3 bg-white rounded-2xl inline-block shadow-sm border border-zinc-200 mb-4">
            <QRCodeSVG
              value={joinUrl}
              size={200}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center mb-4">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
              Game PIN
            </span>
            <span className="text-3xl font-mono font-bold tracking-widest text-zinc-100">
              {roomCode}
            </span>
          </div>

          <div className="flex gap-2 w-full">
            <Button
              onClick={copyToClipboard}
              variant={copied ? 'secondary' : 'default'}
              className="flex-1 text-xs h-10 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Link Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Direct Link
                </>
              )}
            </Button>

            <a
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-10 px-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

