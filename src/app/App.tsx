import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBrowserAudioService } from "../audio/audioService";
import { resolveAudioText } from "../audio/audioManifest";
import { ptPTAudioManifest } from "../audio/manifest";
import type { AudioService } from "../audio/types";
import { LessonScreen } from "../components/LessonScreen";
import { ptPTStarterPack } from "../curriculum/ptPTPack";
import type { LessonEvent } from "../engine/events";
import { displayKey, normalizePhysicalKey } from "../engine/inputEngine";
import {
  createLessonState,
  getCurrentTarget,
  processLessonBackspace,
  processLessonInput,
} from "../engine/lessonEngine";
import {
  createBrowserProgressStore,
  type ProgressSnapshot,
  type ProgressStore,
} from "../progress/progressStore";

interface AppProps {
  audioService?: AudioService;
  initialItemId?: string;
  progressStore?: ProgressStore;
}

type AudioLessonEvent = Extract<LessonEvent, { audioId?: string }>;
const AUDIO_VOLUME_STORAGE_KEY = "teclaler.audioVolume";
const DEFAULT_AUDIO_VOLUME = 1;
const MIN_AUDIO_VOLUME = 0.25;

export function App({ audioService, initialItemId, progressStore }: AppProps) {
  const learningInputRef = useRef<HTMLElement | null>(null);
  const service = useMemo(
    () => audioService ?? createBrowserAudioService(ptPTAudioManifest),
    [audioService],
  );
  const progress = useMemo(
    () => progressStore ?? createBrowserProgressStore(),
    [progressStore],
  );
  const initialItemIndex = getInitialItemIndex(initialItemId);
  const [currentItemIndex, setCurrentItemIndex] = useState(initialItemIndex);
  const currentItem = ptPTStarterPack.items[currentItemIndex];
  const [lessonState, setLessonStateValue] = useState(() =>
    createLessonState(currentItem),
  );
  const lessonStateRef = useRef(lessonState);
  const audioQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [progressSnapshot, setProgressSnapshot] = useState<ProgressSnapshot>(
    () => progress.load(),
  );
  const [audioCue, setAudioCue] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [rejectedKey, setRejectedKey] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState(loadAudioVolume);
  const canGoPrevious = currentItemIndex > 0;
  const canGoNext = currentItemIndex < ptPTStarterPack.items.length - 1;

  const restoreLearningFocus = useCallback(() => {
    learningInputRef.current?.focus({ preventScroll: true });
  }, []);

  const setLessonState = useCallback((nextState: typeof lessonState) => {
    lessonStateRef.current = nextState;
    setLessonStateValue(nextState);
  }, []);

  const playAudioEvents = useCallback(
    (events: LessonEvent[]) => {
      const audioEvents = events.filter(hasAudioId);
      const cueEvent = audioEvents[audioEvents.length - 1];

      if (cueEvent?.audioId) {
        setAudioCue(resolveAudioText(ptPTAudioManifest, cueEvent.audioId));
      }

      const [firstAudioId, ...queuedAudioIds] = audioEvents.map(
        (event) => event.audioId,
      );
      if (!firstAudioId) {
        return;
      }

      const firstPlayback = service
        .play(firstAudioId, { interrupt: true, volume: audioVolume })
        .catch(() => undefined);
      audioQueueRef.current = firstPlayback.then(() =>
        playInSequence(service, queuedAudioIds, audioVolume),
      );
      void audioQueueRef.current;
    },
    [audioVolume, service],
  );

  const handleAudioVolumeChange = useCallback((nextVolume: number) => {
    const volume = normalizeAudioVolume(nextVolume);
    setAudioVolume(volume);
    saveAudioVolume(volume);
  }, []);

  const selectLesson = useCallback(
    (nextIndex: number) => {
      const nextItem = ptPTStarterPack.items[nextIndex];
      setCurrentItemIndex(nextIndex);
      setLessonState(createLessonState(nextItem));
      setAudioCue(null);
      setFeedbackMessage(null);
      setRejectedKey(null);
      restoreLearningFocus();
    },
    [restoreLearningFocus, setLessonState],
  );

  const handleNextLesson = useCallback(() => {
    if (canGoNext && lessonStateRef.current.completed) {
      selectLesson(currentItemIndex + 1);
    } else {
      restoreLearningFocus();
    }
  }, [canGoNext, currentItemIndex, restoreLearningFocus, selectLesson]);

  const handlePreviousLesson = useCallback(() => {
    if (canGoPrevious) {
      selectLesson(currentItemIndex - 1);
    } else {
      restoreLearningFocus();
    }
  }, [canGoPrevious, currentItemIndex, restoreLearningFocus, selectLesson]);

  const handleBackspace = useCallback(() => {
    const update = processLessonBackspace(currentItem, lessonStateRef.current);
    setLessonState(update.state);
    setFeedbackMessage(null);
    setAudioCue(null);
    setRejectedKey(null);
    restoreLearningFocus();
  }, [currentItem, restoreLearningFocus, setLessonState]);

  const handleCanonicalInput = useCallback(
    (key: string) => {
      if (key === "backspace") {
        handleBackspace();
        return;
      }

      const update = processLessonInput(
        currentItem,
        lessonStateRef.current,
        key,
      );
      setLessonState(update.state);

      if (update.events.length > 0) {
        setProgressSnapshot(
          progress.recordLessonEvents(currentItem, update.events),
        );

        const rejectedEvent = update.events.find(
          (event) => event.type === "KEY_REJECTED",
        );
        if (rejectedEvent?.type === "KEY_REJECTED") {
          const message = `Precisamos da letra ${displayKey(rejectedEvent.expected)}.`;
          setFeedbackMessage(message);
          setRejectedKey(rejectedEvent.actual);
          void service.speak(
            { text: message, locale: currentItem.locale },
            { interrupt: true, volume: audioVolume },
          );
        } else {
          setFeedbackMessage(null);
          setRejectedKey(null);
        }

        playAudioEvents(update.events);
      }

      restoreLearningFocus();
    },
    [
      currentItem,
      handleBackspace,
      audioVolume,
      playAudioEvents,
      progress,
      restoreLearningFocus,
      service,
      setLessonState,
    ],
  );

  const handleReplay = useCallback(() => {
    if (currentItem.audio.word) {
      setAudioCue(resolveAudioText(ptPTAudioManifest, currentItem.audio.word));
      audioQueueRef.current = Promise.resolve();
      void service.play(currentItem.audio.word, {
        interrupt: true,
        volume: audioVolume,
      });
    }
    restoreLearningFocus();
  }, [audioVolume, currentItem, restoreLearningFocus, service]);

  useEffect(() => {
    const audioIds = [
      ...(currentItem.audio.letters ?? []),
      ...(currentItem.audio.syllables ?? []),
      ...(currentItem.audio.word ? [currentItem.audio.word] : []),
    ];
    void service.preload(audioIds);
  }, [currentItem, service]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" &&
        lessonStateRef.current.completed &&
        canGoNext
      ) {
        event.preventDefault();
        handleNextLesson();
        return;
      }

      const key = normalizePhysicalKey(event);
      if (!key) {
        return;
      }

      event.preventDefault();
      handleCanonicalInput(key);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canGoNext, handleCanonicalInput, handleNextLesson]);

  useEffect(() => {
    restoreLearningFocus();
  }, [restoreLearningFocus]);

  return (
    <LessonScreen
      audioCue={audioCue}
      canGoNext={canGoNext && lessonState.completed}
      canGoPrevious={canGoPrevious}
      currentKey={getCurrentTarget(lessonState)}
      feedbackMessage={feedbackMessage}
      audioVolume={audioVolume}
      item={currentItem}
      learningInputRef={learningInputRef}
      lessonPosition={{
        current: currentItemIndex + 1,
        total: ptPTStarterPack.items.length,
      }}
      lessonState={lessonState}
      localCompletionCount={
        progressSnapshot.completedItems[currentItem.id] ?? 0
      }
      onNextLesson={handleNextLesson}
      onAudioVolumeChange={handleAudioVolumeChange}
      onKeyPress={handleCanonicalInput}
      onPreviousLesson={handlePreviousLesson}
      onReplay={handleReplay}
      rejectedKey={rejectedKey}
    />
  );
}

function getInitialItemIndex(initialItemId: string | undefined): number {
  if (!initialItemId) {
    return 0;
  }

  const index = ptPTStarterPack.items.findIndex(
    (item) => item.id === initialItemId,
  );
  return index >= 0 ? index : 0;
}

function hasAudioId(
  event: LessonEvent,
): event is AudioLessonEvent & { audioId: string } {
  return (
    "audioId" in event &&
    typeof event.audioId === "string" &&
    event.audioId.length > 0
  );
}

async function playInSequence(
  audioService: AudioService,
  audioIds: string[],
  volume: number,
): Promise<void> {
  for (const [index, audioId] of audioIds.entries()) {
    await audioService.play(audioId, { interrupt: index === 0, volume });
  }
}

function loadAudioVolume(): number {
  const storage = getLocalStorage();
  if (!storage) {
    return DEFAULT_AUDIO_VOLUME;
  }

  const storedVolume = storage.getItem(AUDIO_VOLUME_STORAGE_KEY);
  return normalizeAudioVolume(
    storedVolume ? Number(storedVolume) : DEFAULT_AUDIO_VOLUME,
  );
}

function saveAudioVolume(volume: number): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  storage.setItem(
    AUDIO_VOLUME_STORAGE_KEY,
    String(normalizeAudioVolume(volume)),
  );
}

function normalizeAudioVolume(volume: number): number {
  if (!Number.isFinite(volume)) {
    return DEFAULT_AUDIO_VOLUME;
  }

  return Math.min(1, Math.max(MIN_AUDIO_VOLUME, volume));
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage ?? null;
  } catch (_error) {
    return null;
  }
}
