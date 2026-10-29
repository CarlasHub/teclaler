import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createBrowserAudioService } from "../audio/audioService";
import { resolveAudioText } from "../audio/audioManifest";
import { audioManifestsByLocale } from "../audio/manifest";
import { hasBrowserAudioOutputSupport } from "../audio/ttsFallback";
import type { AudioService } from "../audio/types";
import { LessonScreen } from "../components/LessonScreen";
import { HomeScreen, type HomeStage } from "../components/HomeScreen";
import {
  curriculumPacksByLocale,
  supportedLessonLocales,
} from "../curriculum/portuguesePacks";
import { ptPTStages, ptPTYearOnePack } from "../curriculum/ptPTYearOnePack";
import type { CurriculumPack, LessonLocale } from "../curriculum/types";
import type { LessonEvent } from "../engine/events";
import { displayKey, normalizePhysicalKey } from "../engine/inputEngine";
import {
  createLessonState,
  getLessonReplayTarget,
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
  initialLocale?: LessonLocale;
  progressStore?: ProgressStore;
  initialView?: "home" | "lesson";
}

type AudioLessonEvent = Extract<LessonEvent, { audioId?: string }>;
const AUDIO_VOLUME_STORAGE_KEY = "teclaler.audioVolume";
const AUTO_ADVANCE_STORAGE_KEY = "teclaler.autoAdvance";
const LESSON_LOCALE_STORAGE_KEY = "teclaler.lessonLocale";
const LEGACY_PORTUGUESE_LOCALE_STORAGE_KEY = "teclaler.portugueseLocale";
const STAGE_STORAGE_KEY = "teclaler.stage.pt-PT";
const DEFAULT_AUDIO_VOLUME = 1;
const MIN_AUDIO_VOLUME = 0.25;
const AUTO_ADVANCE_DELAY_MS = 1400;

export function App({
  audioService,
  initialItemId,
  initialLocale,
  progressStore,
  initialView,
}: AppProps) {
  const learningInputRef = useRef<HTMLElement | null>(null);
  const [view, setView] = useState<"home" | "lesson">(
    () => initialView ?? (initialItemId ? "lesson" : "home"),
  );
  const [selectedLocale, setSelectedLocale] = useState<LessonLocale>(
    () => initialLocale ?? loadPreferredLessonLocale(),
  );
  const [selectedStage, setSelectedStage] = useState<number>(() => {
    if (initialItemId) {
      return (
        ptPTYearOnePack.items.find((item) => item.id === initialItemId)
          ?.difficulty ?? 1
      );
    }
    return progressStore ? 1 : loadPreferredStage();
  });
  const [audioUnavailable, setAudioUnavailable] = useState(
    () => !hasBrowserAudioOutputSupport(),
  );
  const currentPack = useMemo(
    () => getStagePack(selectedLocale, selectedStage),
    [selectedLocale, selectedStage],
  );
  const currentManifest = audioManifestsByLocale[selectedLocale];
  const service = useMemo(
    () =>
      audioService ??
      createBrowserAudioService(currentManifest, {
        onAudioAvailable: () => setAudioUnavailable(false),
        onAudioUnavailable: () =>
          setAudioUnavailable(!hasBrowserAudioOutputSupport()),
      }),
    [audioService, currentManifest],
  );
  const progress = useMemo(
    () => progressStore ?? createBrowserProgressStore(),
    [progressStore],
  );
  const initialItemIndex = getInitialItemIndex(
    initialItemId ??
      (progressStore
        ? undefined
        : loadLastItemId(selectedLocale, selectedStage)),
    currentPack,
  );
  const [currentItemIndex, setCurrentItemIndex] = useState(initialItemIndex);
  const currentItem = currentPack.items[currentItemIndex];
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
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [rejectedKey, setRejectedKey] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState(loadAudioVolume);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(
    loadAutoAdvanceEnabled,
  );
  const [autoAdvanceResetKey, setAutoAdvanceResetKey] = useState(0);
  const canGoPrevious = currentItemIndex > 0;
  const canGoNext = currentItemIndex < currentPack.items.length - 1;
  const replayTarget = getLessonReplayTarget(currentItem, lessonState);

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
        setAudioCue(resolveAudioText(currentManifest, cueEvent.audioId));
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
      audioQueueRef.current = firstPlayback
        .then(() => playInSequence(service, queuedAudioIds, audioVolume))
        .catch(() => undefined);
      void audioQueueRef.current;
    },
    [audioVolume, currentManifest, service],
  );

  const handleAudioVolumeChange = useCallback((nextVolume: number) => {
    const volume = normalizeAudioVolume(nextVolume);
    setAudioVolume(volume);
    saveAudioVolume(volume);
  }, []);

  const handleAutoAdvanceChange = useCallback((enabled: boolean) => {
    setAutoAdvanceEnabled(enabled);
    getLocalStorage()?.setItem(AUTO_ADVANCE_STORAGE_KEY, String(enabled));
  }, []);

  const selectLesson = useCallback(
    (nextIndex: number) => {
      const nextItem = currentPack.items[nextIndex];
      saveLastItemId(selectedLocale, selectedStage, nextItem.id);
      setCurrentItemIndex(nextIndex);
      setLessonState(createLessonState(nextItem));
      setAudioCue(null);
      setFeedbackMessage(null);
      setPressedKey(null);
      setRejectedKey(null);
      restoreLearningFocus();
    },
    [
      currentPack,
      restoreLearningFocus,
      selectedLocale,
      selectedStage,
      setLessonState,
    ],
  );

  const handleStageChange = useCallback(
    (nextStage: number) => {
      if (
        selectedLocale !== "pt-PT" ||
        !ptPTStages.some((stage) => stage.id === nextStage)
      )
        return;
      savePreferredStage(nextStage);
      const nextPack = getStagePack("pt-PT", nextStage);
      const nextIndex = getInitialItemIndex(
        loadLastItemId("pt-PT", nextStage),
        nextPack,
      );
      saveLastItemId("pt-PT", nextStage, nextPack.items[nextIndex].id);
      setSelectedStage(nextStage);
      setCurrentItemIndex(nextIndex);
      setLessonState(createLessonState(nextPack.items[nextIndex]));
      setAudioCue(null);
      setFeedbackMessage(null);
      setPressedKey(null);
      setRejectedKey(null);
      restoreLearningFocus();
    },
    [restoreLearningFocus, selectedLocale, setLessonState],
  );

  const handleStartStage = useCallback(
    (stage: number) => {
      if (selectedLocale === "pt-PT") {
        handleStageChange(stage);
      } else {
        const nextPack = getStagePack(selectedLocale, 1);
        const nextIndex = getInitialItemIndex(
          loadLastItemId(selectedLocale, 1),
          nextPack,
        );
        saveLastItemId(selectedLocale, 1, nextPack.items[nextIndex].id);
        setCurrentItemIndex(nextIndex);
        setLessonState(createLessonState(nextPack.items[nextIndex]));
      }
      setView("lesson");
    },
    [handleStageChange, selectedLocale, setLessonState],
  );

  const handleLessonLocaleChange = useCallback(
    (nextLocale: LessonLocale) => {
      if (nextLocale === selectedLocale) {
        return;
      }

      const nextStage = nextLocale === "pt-PT" ? loadPreferredStage() : 1;
      const nextPack = getStagePack(nextLocale, nextStage);
      const nextIndex = getInitialItemIndex(
        loadLastItemId(nextLocale, nextStage),
        nextPack,
      );
      const nextItem = nextPack.items[nextIndex];

      savePreferredLessonLocale(nextLocale);
      setSelectedLocale(nextLocale);
      setSelectedStage(nextStage);
      setCurrentItemIndex(nextIndex);
      setLessonState(createLessonState(nextItem));
      setAudioCue(null);
      setFeedbackMessage(null);
      setPressedKey(null);
      setRejectedKey(null);
    },
    [selectedLocale, setLessonState],
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
    setPressedKey("backspace");
    setRejectedKey(null);
  }, [currentItem, setLessonState]);

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
          const message = getWrongKeyFeedback(
            currentItem.locale,
            rejectedEvent.expected,
          );
          setFeedbackMessage(message);
          setPressedKey(null);
          setRejectedKey(rejectedEvent.actual);
          void service.speak(
            { text: message, locale: currentItem.locale },
            { interrupt: true, volume: audioVolume },
          );
        } else {
          const acceptedEvent = update.events.find(
            (event) => event.type === "KEY_ACCEPTED",
          );
          setFeedbackMessage(null);
          setPressedKey(
            acceptedEvent?.type === "KEY_ACCEPTED" ? acceptedEvent.char : null,
          );
          setRejectedKey(null);
        }

        playAudioEvents(update.events);
      }
    },
    [
      currentItem,
      handleBackspace,
      audioVolume,
      playAudioEvents,
      progress,
      service,
      setLessonState,
    ],
  );

  const handleReplay = useCallback(() => {
    const target = getLessonReplayTarget(currentItem, lessonStateRef.current);
    if (target.disabled) {
      return;
    }

    setAudioCue(target.displayText);
    if (lessonStateRef.current.completed) {
      setAutoAdvanceResetKey((key) => key + 1);
    }

    if (target.audioId) {
      audioQueueRef.current = service
        .play(target.audioId, { interrupt: true, volume: audioVolume })
        .catch(() => undefined);
      return;
    }

    audioQueueRef.current = service
      .speak(
        { text: target.text, locale: currentItem.locale },
        { interrupt: true, volume: audioVolume },
      )
      .catch(() => undefined);
  }, [audioVolume, currentItem, service]);

  const handleHearWord = useCallback(() => {
    setAudioCue(currentItem.displayText);
    if (lessonStateRef.current.completed) {
      setAutoAdvanceResetKey((key) => key + 1);
    }
    if (currentItem.audio.word) {
      audioQueueRef.current = service
        .play(currentItem.audio.word, {
          interrupt: true,
          volume: audioVolume,
        })
        .catch(() => undefined);
    } else {
      audioQueueRef.current = service
        .speak(
          { text: currentItem.text, locale: currentItem.locale },
          { interrupt: true, volume: audioVolume },
        )
        .catch(() => undefined);
    }
  }, [audioVolume, currentItem, service]);

  const handleRestartWord = useCallback(() => {
    setLessonState(createLessonState(currentItem));
    setAudioCue(null);
    setFeedbackMessage(null);
    setPressedKey(null);
    setRejectedKey(null);
    restoreLearningFocus();
  }, [currentItem, restoreLearningFocus, setLessonState]);

  const handleSkipWord = useCallback(() => {
    if (canGoNext) selectLesson(currentItemIndex + 1);
  }, [canGoNext, currentItemIndex, selectLesson]);

  useEffect(() => {
    setAudioUnavailable(!hasBrowserAudioOutputSupport());
  }, [selectedLocale]);

  useEffect(() => {
    updateDocumentLanguage(selectedLocale);
  }, [selectedLocale]);

  useEffect(() => {
    const audioIds = [
      ...(currentItem.audio.letters ?? []),
      ...(currentItem.audio.syllables ?? []),
      ...(currentItem.audio.word ? [currentItem.audio.word] : []),
    ];
    void service.preload(audioIds);
  }, [currentItem, service]);

  useEffect(() => {
    if (
      view !== "lesson" ||
      !autoAdvanceEnabled ||
      !lessonState.completed ||
      !canGoNext
    ) {
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    const scheduleNext = () => {
      if (cancelled) return;
      timer = window.setTimeout(() => {
        if (cancelled) return;
        if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
          scheduleNext();
          return;
        }
        if (
          lessonStateRef.current.completed &&
          lessonStateRef.current.itemId === currentItem.id
        ) {
          selectLesson(currentItemIndex + 1);
        }
      }, AUTO_ADVANCE_DELAY_MS);
    };
    void audioQueueRef.current.then(scheduleNext, scheduleNext);
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [
    autoAdvanceEnabled,
    autoAdvanceResetKey,
    canGoNext,
    currentItem.id,
    currentItemIndex,
    lessonState.completed,
    selectLesson,
    view,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (view !== "lesson") return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      if (shouldLetFocusedControlHandleKey(event)) {
        return;
      }

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
  }, [canGoNext, handleCanonicalInput, handleNextLesson, view]);

  useEffect(() => {
    if (view === "lesson") restoreLearningFocus();
  }, [restoreLearningFocus, view]);

  useLayoutEffect(() => {
    (document.scrollingElement ?? document.documentElement).scrollTop = 0;
  }, [view, currentItem.id]);

  const homeStages: HomeStage[] =
    selectedLocale === "pt-PT"
      ? ptPTStages.map((stage) => {
          const items = getStagePack("pt-PT", stage.id).items;
          return {
            ...stage,
            total: items.length,
            completed: items.filter(
              (item) => (progressSnapshot.completedItems[item.id] ?? 0) > 0,
            ).length,
          };
        })
      : [
          {
            id: 1,
            title:
              selectedLocale === "en-GB" ? "First words" : "Primeiras palavras",
            total: currentPack.items.length,
            completed: currentPack.items.filter(
              (item) => (progressSnapshot.completedItems[item.id] ?? 0) > 0,
            ).length,
          },
        ];
  const completedWordCount = currentPack.items.filter(
    (item) => (progressSnapshot.completedItems[item.id] ?? 0) > 0,
  ).length;
  const firstUnfinishedIndex = currentPack.items.findIndex(
    (item) => (progressSnapshot.completedItems[item.id] ?? 0) === 0,
  );

  if (view === "home") {
    return (
      <HomeScreen
        locale={selectedLocale}
        stages={homeStages}
        selectedStage={selectedStage}
        resumeWord={
          loadLastItemId(selectedLocale, selectedStage)
            ? currentItem.displayText
            : null
        }
        onLocaleChange={handleLessonLocaleChange}
        onStartStage={handleStartStage}
      />
    );
  }

  return (
    <LessonScreen
      audioCue={audioCue}
      audioUnavailable={audioUnavailable}
      hasNextWord={canGoNext}
      canGoPrevious={canGoPrevious}
      feedbackMessage={feedbackMessage}
      audioVolume={audioVolume}
      autoAdvanceEnabled={autoAdvanceEnabled}
      item={currentItem}
      learningInputRef={learningInputRef}
      lessonPosition={{
        current: currentItemIndex + 1,
        total: currentPack.items.length,
      }}
      lessonState={lessonState}
      selectedStage={selectedStage}
      stageOptions={selectedLocale === "pt-PT" ? ptPTStages : []}
      onStageChange={handleStageChange}
      completedWordCount={completedWordCount}
      localCompletionCount={
        progressSnapshot.completedItems[currentItem.id] ?? 0
      }
      onNextLesson={handleNextLesson}
      onAudioVolumeChange={handleAudioVolumeChange}
      onAutoAdvanceChange={handleAutoAdvanceChange}
      onKeyPress={handleCanonicalInput}
      onPreviousLesson={handlePreviousLesson}
      onLessonLocaleChange={handleLessonLocaleChange}
      onReplay={handleReplay}
      onHearWord={handleHearWord}
      onRestartWord={handleRestartWord}
      onSkipWord={handleSkipWord}
      onHome={() => {
        if (lessonState.completed && firstUnfinishedIndex >= 0) {
          selectLesson(firstUnfinishedIndex);
        }
        setView("home");
      }}
      onNextStage={
        selectedLocale === "pt-PT" && selectedStage < 4
          ? () => handleStartStage(selectedStage + 1)
          : undefined
      }
      onReviewUnfinished={() => {
        if (firstUnfinishedIndex >= 0) selectLesson(firstUnfinishedIndex);
        else setView("home");
      }}
      pressedKey={pressedKey}
      lessonLocale={selectedLocale}
      replayDisabled={replayTarget.disabled}
      replayText={replayTarget.displayText}
      rejectedKey={rejectedKey}
      supportedLessonLocales={supportedLessonLocales}
    />
  );
}

function getStagePack(locale: LessonLocale, stage: number): CurriculumPack {
  if (locale !== "pt-PT") return curriculumPacksByLocale[locale];
  return {
    ...ptPTYearOnePack,
    id: `${ptPTYearOnePack.id}-stage-${stage}`,
    items: ptPTYearOnePack.items.filter((item) => item.difficulty === stage),
  };
}

function loadPreferredStage(): number {
  const value = Number(getLocalStorage()?.getItem(STAGE_STORAGE_KEY));
  return ptPTStages.some((stage) => stage.id === value) ? value : 1;
}

function savePreferredStage(stage: number): void {
  getLocalStorage()?.setItem(STAGE_STORAGE_KEY, String(stage));
}

function lastItemStorageKey(locale: LessonLocale, stage: number): string {
  return `teclaler.lastItem.${locale}.${stage}`;
}

function loadLastItemId(
  locale: LessonLocale,
  stage: number,
): string | undefined {
  return (
    getLocalStorage()?.getItem(lastItemStorageKey(locale, stage)) ?? undefined
  );
}

function saveLastItemId(locale: LessonLocale, stage: number, id: string): void {
  getLocalStorage()?.setItem(lastItemStorageKey(locale, stage), id);
}

function shouldLetFocusedControlHandleKey(event: KeyboardEvent): boolean {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tagName = target.tagName.toLowerCase();

  if (tagName === "input" || tagName === "select" || tagName === "textarea") {
    return true;
  }

  return (
    tagName === "button" &&
    (event.key === "Enter" ||
      event.key === " " ||
      event.key === "Spacebar" ||
      event.key.toLocaleLowerCase("pt-PT") === "space")
  );
}

function getInitialItemIndex(
  initialItemId: string | undefined,
  pack: CurriculumPack,
): number {
  if (!initialItemId) {
    return 0;
  }

  const index = pack.items.findIndex((item) => item.id === initialItemId);
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

function loadAutoAdvanceEnabled(): boolean {
  return getLocalStorage()?.getItem(AUTO_ADVANCE_STORAGE_KEY) !== "false";
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

function loadPreferredLessonLocale(): LessonLocale {
  const storage = getLocalStorage();
  if (!storage) {
    return "pt-PT";
  }

  const storedLocale =
    storage.getItem(LESSON_LOCALE_STORAGE_KEY) ??
    storage.getItem(LEGACY_PORTUGUESE_LOCALE_STORAGE_KEY);
  return isSupportedLessonLocale(storedLocale) ? storedLocale : "pt-PT";
}

function savePreferredLessonLocale(locale: LessonLocale): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  storage.setItem(LESSON_LOCALE_STORAGE_KEY, locale);
  storage.removeItem(LEGACY_PORTUGUESE_LOCALE_STORAGE_KEY);
}

function isSupportedLessonLocale(
  locale: string | null,
): locale is LessonLocale {
  return supportedLessonLocales.includes(locale as LessonLocale);
}

function getWrongKeyFeedback(locale: LessonLocale, expected: string): string {
  const letter = displayKey(expected);
  if (locale === "en-GB") {
    return `We need the letter ${letter}.`;
  }

  return `Precisamos da letra ${letter}.`;
}

function normalizeAudioVolume(volume: number): number {
  if (!Number.isFinite(volume)) {
    return DEFAULT_AUDIO_VOLUME;
  }

  return Math.min(1, Math.max(MIN_AUDIO_VOLUME, volume));
}

function updateDocumentLanguage(locale: LessonLocale): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.lang = locale;
  document.title =
    locale === "en-GB"
      ? "TeclaLer - Listen. Read. Type."
      : "TeclaLer - Ouve. Lê. Escreve.";

  const description =
    document.querySelector<HTMLMetaElement>('meta[name="description"]') ??
    createMetaDescriptionElement();

  description.content =
    locale === "en-GB"
      ? "TeclaLer: Listen. Read. Type."
      : "TeclaLer: Ouve. Lê. Escreve.";
}

function createMetaDescriptionElement(): HTMLMetaElement {
  const description = document.createElement("meta");
  description.name = "description";
  document.head.append(description);
  return description;
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
