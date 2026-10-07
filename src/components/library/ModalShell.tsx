// src/components/ui/ModalShell.tsx — Shared glass modal shell used by every library modal
//
// Why this exists:
//  • It renders into document.body through a portal. A modal rendered inside a page layout can end up
//    trapped by an ancestor that has transform / filter / backdrop-filter / overflow, which makes
//    `position: fixed` behave like `absolute` and can hide or clip the panel.
//  • Only the dimmed overlay uses backdrop-blur. The panel itself does not, because nested
//    backdrop-filters render the inner panel blank in some browsers.
//  • One shared Escape / scroll-lock handler, so stacked modals close one at a time.
import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const stack: string[] = [];
let lockCount = 0;
let savedOverflow = '';

interface ModalShellProps {
    label: string;
    onClose: () => void;
    children: React.ReactNode;
    /** Width, height and overflow classes for the panel, e.g. "max-w-md overflow-y-auto" */
    panelClassName?: string;
    zIndex?: number;
}

export const ModalShell: React.FC<ModalShellProps> = ({
    label,
    onClose,
    children,
    panelClassName = '',
    zIndex = 50,
}) => {
    const id = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    useEffect(() => {
        stack.push(id);
        if (lockCount++ === 0) {
            savedOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }

        // Move focus into the dialog unless something inside already took it (e.g. an autofocus input)
        const panel = panelRef.current;
        if (panel && !panel.contains(document.activeElement)) panel.focus({ preventScroll: true });

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && stack[stack.length - 1] === id) {
                e.stopPropagation();
                closeRef.current();
            }
        };
        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('keydown', onKey);
            const i = stack.indexOf(id);
            if (i !== -1) stack.splice(i, 1);
            if (--lockCount === 0) document.body.style.overflow = savedOverflow;
        };
    }, [id]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            style={{ zIndex }}
            className="fixed inset-0 flex items-end justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-200 sm:items-center sm:p-4"
            // Portals bubble React events to the parent tree, so stop clicks reaching a clickable card underneath
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={label}
                onClick={(e) => e.stopPropagation()}
                className={`relative max-h-[94vh] w-full rounded-t-[32px] border border-white/[0.12] bg-[#150b10]/95 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.1)] outline-none sm:rounded-[32px] ${panelClassName}`}
            >
                {children}
            </div>
        </div>,
        document.body
    );
};