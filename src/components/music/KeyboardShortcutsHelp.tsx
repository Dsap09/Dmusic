'use client';

import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { useEffect } from 'react';

export function KeyboardShortcutsHelp() {
    const [open, setOpen] = useState(false);

    // Listen for '?' key to open help
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input field
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            if (e.key === '?' && !e.shiftKey) {
                e.preventDefault();
                setOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    const shortcuts = [
        {
            category: 'Playback',
            items: [
                { action: 'Play/Pause', keys: KEYBOARD_SHORTCUTS.playPause },
                { action: 'Next Track', keys: KEYBOARD_SHORTCUTS.next },
                { action: 'Previous Track', keys: KEYBOARD_SHORTCUTS.previous },
            ],
        },
        {
            category: 'Volume',
            items: [
                { action: 'Volume Up', keys: KEYBOARD_SHORTCUTS.volumeUp },
                { action: 'Volume Down', keys: KEYBOARD_SHORTCUTS.volumeDown },
                { action: 'Mute/Unmute', keys: KEYBOARD_SHORTCUTS.mute },
            ],
        },
        {
            category: 'Features',
            items: [
                { action: 'Toggle Shuffle', keys: KEYBOARD_SHORTCUTS.shuffle },
                { action: 'Toggle Repeat', keys: KEYBOARD_SHORTCUTS.repeat },
                { action: 'Toggle Queue', keys: KEYBOARD_SHORTCUTS.queue },
                { action: 'Toggle Lyrics', keys: KEYBOARD_SHORTCUTS.lyrics },
            ],
        },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Keyboard Shortcuts (? key)"
                >
                    <Keyboard className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        Keyboard Shortcuts
                    </DialogTitle>
                    <DialogDescription>
                        Use these shortcuts to control playback without clicking
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {shortcuts.map((section) => (
                        <div key={section.category}>
                            <h3 className="text-sm font-semibold mb-3 text-primary">
                                {section.category}
                            </h3>
                            <div className="space-y-2">
                                {section.items.map((item) => (
                                    <div
                                        key={item.action}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <span className="text-sm">{item.action}</span>
                                        <div className="flex items-center gap-2">
                                            {item.keys.map((key, index) => (
                                                <div key={index} className="flex items-center gap-1">
                                                    {index > 0 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            or
                                                        </span>
                                                    )}
                                                    <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded">
                                                        {key}
                                                    </kbd>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                    Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">?</kbd> anytime to view shortcuts
                </div>
            </DialogContent>
        </Dialog>
    );
}
