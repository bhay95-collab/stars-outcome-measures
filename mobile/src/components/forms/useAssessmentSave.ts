import { useCallback, useState } from 'react';
import { useMountedRef } from '../../hooks/useMountedRef';
import { useAuth } from '../../auth/AuthProvider';
import { saveAssessment } from '../../supabase/assessments';
import { ACTION_TIMEOUT_MS } from '../../utils/withTimeout';

export type SaveState = 'idle' | 'saving' | 'timed-out' | 'saved' | 'error';

export interface AssessmentSavePayload {
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
}

interface UseAssessmentSaveOptions {
  patientId: string;
  measure: string;
  buildPayload: () => AssessmentSavePayload | null;
  onSaved?: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function useAssessmentSave({
  patientId,
  measure,
  buildPayload,
  onSaved,
}: UseAssessmentSaveOptions) {
  const { user } = useAuth();
  const mountedRef = useMountedRef();
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const resetSaveState = useCallback(() => {
    setSaveState('idle');
    setSaveError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (saveState === 'saving' || saveState === 'timed-out') return;

    const payload = buildPayload();
    if (!payload) return;

    if (!user) {
      setSaveError('Your session has expired. Please sign in again.');
      setSaveState('error');
      return;
    }

    setSaveState('saving');
    setSaveError(null);

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      if (mountedRef.current) {
        setSaveState('timed-out');
        setSaveError('Save timed out. Your result may not have been saved. Check your connection before trying again.');
      }
    }, ACTION_TIMEOUT_MS);

    const meta = isRecord(payload.results.meta) ? payload.results.meta : {};

    try {
      await saveAssessment({
        patient_id: patientId,
        measure,
        inputs: payload.inputs,
        results: {
          ...payload.results,
          meta: {
            ...meta,
            encounterDate: new Date().toISOString(),
          },
        },
      });
      clearTimeout(timeoutId);
      if (!timedOut && mountedRef.current) {
        onSaved?.();
        setSaveState('saved');
        setTimeout(() => {
          if (mountedRef.current) setSaveState('idle');
        }, 3000);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (!timedOut && mountedRef.current) {
        setSaveError(error instanceof Error ? error.message : 'Unable to save result. Please try again.');
        setSaveState('error');
      }
    }
  }, [buildPayload, measure, mountedRef, onSaved, patientId, saveState, user]);

  return {
    saveState,
    saveError,
    handleSave,
    resetSaveState,
    saveDisabled: saveState === 'saving' || saveState === 'timed-out',
  };
}
