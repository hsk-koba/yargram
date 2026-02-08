import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLogWindowShortcut } from './useLogWindowShortcut';
describe('useLogWindowShortcut', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    it('returns isOpen false initially', () => {
        const { result } = renderHook(() => useLogWindowShortcut());
        expect(result.current.isOpen).toBe(false);
        expect(result.current.escapeCount).toBe(0);
    });
    it('open() sets isOpen to true', () => {
        const { result } = renderHook(() => useLogWindowShortcut());
        act(() => {
            result.current.open();
        });
        expect(result.current.isOpen).toBe(true);
    });
    it('close() sets isOpen to false', () => {
        const { result } = renderHook(() => useLogWindowShortcut());
        act(() => {
            result.current.open();
        });
        act(() => {
            result.current.close();
        });
        expect(result.current.isOpen).toBe(false);
    });
    it('toggle() flips isOpen', () => {
        const { result } = renderHook(() => useLogWindowShortcut());
        expect(result.current.isOpen).toBe(false);
        act(() => {
            result.current.toggle();
        });
        expect(result.current.isOpen).toBe(true);
        act(() => {
            result.current.toggle();
        });
        expect(result.current.isOpen).toBe(false);
    });
    it('opening after threshold Escape key presses', () => {
        const { result } = renderHook(() => useLogWindowShortcut({ escapeCount: 3, resetAfterMs: 2000 }));
        const dispatchEscape = () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        };
        expect(result.current.isOpen).toBe(false);
        act(() => {
            dispatchEscape();
        });
        expect(result.current.escapeCount).toBe(1);
        act(() => {
            dispatchEscape();
        });
        expect(result.current.escapeCount).toBe(2);
        act(() => {
            dispatchEscape();
        });
        expect(result.current.isOpen).toBe(true);
        expect(result.current.escapeCount).toBe(0);
    });
    it('resets escape count after resetAfterMs', () => {
        const { result } = renderHook(() => useLogWindowShortcut({ escapeCount: 5, resetAfterMs: 500 }));
        const dispatchEscape = () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        };
        act(() => {
            dispatchEscape();
            dispatchEscape();
        });
        expect(result.current.escapeCount).toBe(2);
        act(() => {
            vi.advanceTimersByTime(600);
        });
        expect(result.current.escapeCount).toBe(0);
    });
    it('calls onTrigger when provided and threshold reached', () => {
        const onTrigger = vi.fn();
        const { result } = renderHook(() => useLogWindowShortcut({ escapeCount: 2, onTrigger }));
        const dispatchEscape = () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        };
        act(() => {
            dispatchEscape();
            dispatchEscape();
        });
        expect(onTrigger).toHaveBeenCalledTimes(1);
        expect(result.current.isOpen).toBe(false);
    });
});
