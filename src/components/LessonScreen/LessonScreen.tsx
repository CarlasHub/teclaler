import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
} from "react";
import type { CurriculumItem, LessonLocale } from "../../curriculum/types";
import { containsAccentKey, displayKey } from "../../engine/inputEngine";
import type { LessonState } from "../../engine/lessonEngine";
import { resolvePublicAssetPath } from "../../platform/publicPath";
import { OnScreenKeyboard } from "../OnScreenKeyboard";

interface LessonScreenProps {
  item: CurriculumItem;
  lessonPosition: {
    current: number;
    total: number;
  };
  lessonState: LessonState;
  selectedStage: number;
  stageOptions: readonly { id: number; title: string; description: string }[];
  onStageChange: (stage: number) => void;
  completedWordCount: number;
  audioCue: string | null;
  audioUnavailable: boolean;
  audioVolume: number;
  feedbackMessage: string | null;
  learningInputRef: Ref<HTMLElement>;
  localCompletionCount: number;
  hasNextWord: boolean;
  canGoPrevious: boolean;
  onAudioVolumeChange: (volume: number) => void;
  onKeyPress: (key: string) => void;
  onNextLesson: () => void;
  onPreviousLesson: () => void;
  onLessonLocaleChange: (locale: LessonLocale) => void;
  onReplay: () => void;
  onHearWord: () => void;
  onRestartWord: () => void;
  onSkipWord: () => void;
  onHome: () => void;
  onNextStage?: () => void;
  onReviewUnfinished: () => void;
  pressedKey: string | null;
  lessonLocale: LessonLocale;
  replayDisabled: boolean;
  replayText: string;
  rejectedKey: string | null;
  supportedLessonLocales: LessonLocale[];
}

export function LessonScreen({
  item,
  lessonPosition,
  lessonState,
  selectedStage,
  stageOptions,
  onStageChange,
  completedWordCount,
  audioCue,
  audioUnavailable,
  audioVolume,
  feedbackMessage,
  learningInputRef,
  localCompletionCount,
  hasNextWord,
  canGoPrevious,
  onAudioVolumeChange,
  onKeyPress,
  onNextLesson,
  onPreviousLesson,
  onLessonLocaleChange,
  onReplay,
  onHearWord,
  onRestartWord,
  onSkipWord,
  onHome,
  onNextStage,
  onReviewUnfinished,
  pressedKey,
  lessonLocale,
  replayDisabled,
  replayText,
  rejectedKey,
  supportedLessonLocales,
}: LessonScreenProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const settingsDialogRef = useRef<HTMLElement | null>(null);
  const completionActionRef = useRef<HTMLButtonElement | null>(null);
  const copy = getLessonCopy(lessonLocale);
  const totalLetters = lessonState.targetSequence.length;
  const progressText = lessonState.completed
    ? copy.wordComplete
    : copy.progressCount(lessonState.cursorIndex, totalLetters);
  const lessonCompleted =
    lessonState.completed && completedWordCount === lessonPosition.total;
  const reachedListEnd = lessonState.completed && !hasNextWord;
  const completionTitle = lessonCompleted
    ? copy.stageCompleteTitle
    : reachedListEnd
      ? copy.listEndTitle
      : copy.wordSuccessTitle;
  const completionBody = lessonCompleted
    ? copy.stageCompleteBody
    : reachedListEnd
      ? copy.unfinishedBody(lessonPosition.total - completedWordCount)
      : copy.wordSuccessBody(item.displayText);
  const completionAction = lessonCompleted
    ? (onNextStage ?? onHome)
    : reachedListEnd
      ? onReviewUnfinished
      : onNextLesson;
  const completionActionText = lessonCompleted
    ? onNextStage
      ? copy.nextStage
      : copy.backToStages
    : reachedListEnd
      ? copy.reviewUnfinished
      : copy.nextWord;
  const currentSyllableIndex = getCurrentSyllableIndex(
    item,
    lessonState.cursorIndex,
  );
  const localProgressText =
    localCompletionCount === 1
      ? copy.oneCompletion
      : copy.completions(localCompletionCount);
  const imageSrc = item.imageAsset
    ? resolvePublicAssetPath(item.imageAsset)
    : null;
  const imageAlt = item.imageAlt ?? "";

  useEffect(() => {
    if (settingsOpen) {
      settingsDialogRef.current?.focus();
    }
  }, [settingsOpen]);

  useEffect(() => {
    if (lessonState.completed) {
      completionActionRef.current?.focus({ preventScroll: true });
    }
  }, [item.id, lessonState.completed]);

  const closeSettings = () => {
    setSettingsOpen(false);
    window.setTimeout(() => settingsButtonRef.current?.focus(), 0);
  };

  const handleSettingsKeyDown = (
    event: ReactKeyboardEvent<HTMLElement>,
  ): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSettings();
      return;
    }

    if (event.key === "Tab") {
      trapDialogFocus(event, settingsDialogRef.current);
    }
  };

  return (
    <main
      aria-label={copy.learningAreaLabel}
      aria-labelledby="app-title"
      className="lesson-shell"
      data-testid="learning-input-area"
      ref={learningInputRef}
      tabIndex={0}
    >
      <div className="top-region">
        <header className="brand-header">
          <div>
            <h1 id="app-title">
              <span>Tecla</span>
              <span className="brand-header__green">Ler</span>
            </h1>
            <p>{copy.tagline}</p>
          </div>
          <div className="brand-header__actions">
            <button
              className="lesson-home-button"
              onClick={onHome}
              type="button"
            >
              <span aria-hidden="true">←</span> {copy.home}
            </button>
            <label className="language-selector">
              <span className="visually-hidden">
                {copy.lessonLanguageLabel}
              </span>
              <span className="visually-hidden" id="language-current-variant">
                {`${copy.variantPrefix} ${getLessonLocaleName(lessonLocale, lessonLocale)}`}
              </span>
              <select
                aria-describedby="language-current-variant"
                aria-label={copy.lessonLanguageLabel}
                className="language-selector__select"
                onChange={(event) =>
                  onLessonLocaleChange(
                    event.currentTarget.value as LessonLocale,
                  )
                }
                value={lessonLocale}
              >
                {supportedLessonLocales.map((locale) => (
                  <option key={locale} value={locale}>
                    {`${getLessonLocaleFlag(locale)} ${getLessonLocaleName(locale, lessonLocale)}`}
                  </option>
                ))}
              </select>
            </label>
            <button
              aria-controls="settings-panel"
              aria-expanded={settingsOpen}
              aria-haspopup="dialog"
              className="settings-button"
              ref={settingsButtonRef}
              onClick={() => setSettingsOpen((open) => !open)}
              type="button"
            >
              <span className="settings-button__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
                  <path d="M19.4 13.5a7.8 7.8 0 0 0 0-3l2-1.5-2-3.4-2.4 1a8 8 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.6A8 8 0 0 0 7 6.6l-2.4-1-2 3.4 2 1.5a7.8 7.8 0 0 0 0 3l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 2.6 1.5l.4 2.6h4l.4-2.6a8 8 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.5Z" />
                </svg>
              </span>
              <span>{copy.settings}</span>
            </button>
          </div>
        </header>

        {stageOptions.length > 0 ? (
          <div className="stage-switcher">
            <label htmlFor="lesson-stage-select">Etapa de aprendizagem</label>
            <select
              id="lesson-stage-select"
              onChange={(event) =>
                onStageChange(Number(event.currentTarget.value))
              }
              value={selectedStage}
            >
              {stageOptions.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {`${stage.id}. ${stage.title}`}
                </option>
              ))}
            </select>
            <p>
              {
                stageOptions.find((stage) => stage.id === selectedStage)
                  ?.description
              }
            </p>
          </div>
        ) : null}

        {settingsOpen ? (
          <div className="settings-backdrop" onClick={closeSettings}>
            <section
              aria-labelledby="settings-title"
              aria-modal="true"
              className="settings-panel"
              id="settings-panel"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={handleSettingsKeyDown}
              ref={settingsDialogRef}
              role="dialog"
              tabIndex={-1}
            >
              <div className="settings-panel__header">
                <div className="settings-panel__title-block">
                  <span className="settings-panel__eyebrow">
                    {copy.localMode}
                  </span>
                  <h2 id="settings-title">{copy.settings}</h2>
                </div>
                <button
                  className="settings-close-button"
                  onClick={closeSettings}
                  type="button"
                >
                  {copy.close}
                </button>
              </div>
              <div className="settings-panel__content">
                <section
                  aria-labelledby="settings-language-title"
                  className="settings-section"
                >
                  <div className="settings-section__header">
                    <h3 id="settings-language-title">
                      {copy.lessonLanguageLabel}
                    </h3>
                    <span
                      aria-label={getLessonLocaleName(
                        lessonLocale,
                        lessonLocale,
                      )}
                      className="settings-section__value"
                      role="img"
                    >
                      <span aria-hidden="true">
                        {getLessonLocaleFlag(lessonLocale)}
                      </span>
                    </span>
                  </div>
                  <fieldset className="settings-language-group">
                    <legend className="visually-hidden">
                      {copy.languageVariantLegend}
                    </legend>
                    <div className="settings-options">
                      {supportedLessonLocales.map((locale) => {
                        const selected = locale === lessonLocale;

                        return (
                          <label
                            className={`settings-option${selected ? " settings-option--selected" : ""}`}
                            key={locale}
                          >
                            <input
                              aria-label={getLessonLocaleName(
                                locale,
                                lessonLocale,
                              )}
                              checked={selected}
                              className="settings-option__input"
                              name="lesson-locale"
                              onChange={() => onLessonLocaleChange(locale)}
                              type="radio"
                              value={locale}
                            />
                            <span
                              aria-hidden="true"
                              className="settings-option__control"
                            />
                            <span className="settings-option__body">
                              <span className="settings-option__name">
                                {getLessonLocaleName(locale, lessonLocale)}
                              </span>
                              <span className="settings-option__meta">
                                {getLessonLocaleRegion(locale, lessonLocale)}
                              </span>
                            </span>
                            <span
                              aria-hidden="true"
                              className="settings-option__flag"
                            >
                              {getLessonLocaleFlag(locale)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </section>

                <p className="settings-privacy-note">{copy.privacyNote}</p>
                <section
                  aria-labelledby="settings-progress-title"
                  className="settings-section"
                >
                  <h3 id="settings-progress-title">
                    {lessonLocale === "en-GB"
                      ? "Progress on this device"
                      : "Progresso neste dispositivo"}
                  </h3>
                  <p>
                    {lessonLocale === "en-GB"
                      ? `${completedWordCount} of ${lessonPosition.total} words completed in this stage`
                      : `${completedWordCount} de ${lessonPosition.total} palavras concluídas nesta etapa`}
                  </p>
                </section>
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <section
        className={`lesson-stage${imageSrc ? "" : " lesson-stage--text-only"}`}
        aria-label={copy.currentLessonLabel}
      >
        {imageSrc ? (
          <div
            className="meaning-visual"
            aria-hidden={imageAlt ? undefined : true}
          >
            <img src={imageSrc} alt={imageAlt} />
          </div>
        ) : null}

        <div className="lesson-focus">
          <div className="word-navigation">
            <button
              aria-label={copy.previousWord}
              className="word-navigation__button"
              disabled={!canGoPrevious}
              onClick={onPreviousLesson}
              type="button"
            >
              <span aria-hidden="true" className="word-navigation__arrow">
                ←
              </span>
              <span>{copy.previous}</span>
            </button>
            <div className="word-navigation__target">
              <p className="lesson-focus__label">{copy.wordLabel}</p>
              <div
                className="target-word"
                aria-label={`${copy.targetWordLabel} ${item.displayText}`}
              >
                {item.displayText}
              </div>
            </div>
            <button
              aria-label={
                lessonState.completed ? copy.nextWordArrow : copy.skipToNextWord
              }
              className="word-navigation__button word-navigation__button--next"
              disabled={!hasNextWord}
              onClick={lessonState.completed ? onNextLesson : onSkipWord}
              type="button"
            >
              <span aria-hidden="true" className="word-navigation__arrow">
                →
              </span>
              <span>{copy.nextShort}</span>
            </button>
          </div>

          <div
            className="syllables"
            aria-label={`${copy.syllablesLabel} ${item.syllables?.join(" ") ?? ""}`}
          >
            {item.syllables?.map((syllable, index) => (
              <span
                className={`syllables__item${lessonState.completedSyllableIndexes.includes(index) ? " syllables__item--complete" : ""}${index === currentSyllableIndex ? " syllables__item--current" : ""}`}
                key={syllable}
              >
                {syllable.toLocaleUpperCase(item.locale)}
              </span>
            ))}
          </div>

          {!lessonState.completed ? (
            <p className="lesson-instruction">{copy.typeInstruction}</p>
          ) : null}

          <div
            className="typing-boxes"
            role="list"
            aria-label={`${copy.lettersOfWordLabel} ${item.displayText}`}
          >
            {lessonState.targetSequence.map((expected, index) => {
              const typedLetter = lessonState.typed[index];
              const isCurrent =
                index === lessonState.cursorIndex && !lessonState.completed;

              return (
                <div
                  aria-label={copy.letterBoxLabel(
                    index + 1,
                    totalLetters,
                    typedLetter ? displayKey(typedLetter) : null,
                  )}
                  aria-current={isCurrent ? "true" : undefined}
                  className={`typing-box${isCurrent ? " typing-box--current" : ""}${typedLetter ? " typing-box--filled" : ""}`}
                  key={`${expected}-${index}`}
                  role="listitem"
                >
                  {typedLetter ? displayKey(typedLetter) : ""}
                </div>
              );
            })}
          </div>

          {!lessonState.completed ? (
            <div className="cue-row" aria-live="polite">
              <button
                className="hear-word-button"
                onClick={onHearWord}
                type="button"
              >
                <span aria-hidden="true">♫</span> {copy.hearWord}
              </button>
              {audioCue ? (
                <div className="audio-cue">
                  <span className="audio-cue__label">{copy.audioCueLabel}</span>
                  <strong>{audioCue}</strong>
                </div>
              ) : null}
              <button
                aria-describedby="replay-description"
                className="replay-button"
                disabled={replayDisabled}
                onClick={onReplay}
                type="button"
              >
                {copy.replay}
              </button>
              <span className="visually-hidden" id="replay-description">
                {replayDisabled
                  ? copy.replayDisabled
                  : copy.replayEnabled(replayText)}
              </span>
              <button
                className="restart-word-button"
                onClick={onRestartWord}
                type="button"
              >
                {copy.restartWord}
              </button>
              <label className="volume-control">
                <span>{copy.sound}</span>
                <input
                  aria-label={copy.soundVolume}
                  max="1"
                  min="0.25"
                  onChange={(event) =>
                    onAudioVolumeChange(event.currentTarget.valueAsNumber)
                  }
                  step="0.05"
                  type="range"
                  value={audioVolume}
                />
                <strong>{Math.round(audioVolume * 100)}%</strong>
              </label>
            </div>
          ) : null}

          {audioUnavailable ? (
            <p className="audio-unavailable" role="status">
              {copy.voiceUnavailable}
            </p>
          ) : null}

          {feedbackMessage ? (
            <p className="gentle-feedback" aria-live="polite">
              {feedbackMessage}
            </p>
          ) : null}
        </div>
      </section>

      <p className="visually-hidden" role="status">
        {copy.wordAnnouncement(
          lessonPosition.current,
          lessonPosition.total,
          item.displayText,
        )}
      </p>

      <section className="lesson-status" aria-label={copy.lessonProgressLabel}>
        <p>{copy.wordPosition(lessonPosition.current, lessonPosition.total)}</p>
        <progress
          aria-label={copy.lettersCompletedLabel}
          max={totalLetters}
          value={lessonState.cursorIndex}
        />
        <p>{progressText}</p>
        {lessonCompleted ? (
          <p className="lesson-complete">{copy.lessonComplete}</p>
        ) : null}
        <p className="local-progress">
          {copy.localProgress(localProgressText)}
        </p>
      </section>

      {lessonState.completed ? (
        <section
          className="completion-panel"
          aria-labelledby="completion-title"
        >
          <div className="completion-panel__message" role="status">
            <h2 id="completion-title">{completionTitle}</h2>
            <p id="completion-message">{completionBody}</p>
          </div>
          <div className="completion-panel__actions">
            <button
              aria-describedby="completion-message"
              className="completion-panel__primary"
              onClick={completionAction}
              ref={completionActionRef}
              type="button"
            >
              {completionActionText}
              <span aria-hidden="true"> →</span>
            </button>
            <button onClick={onHearWord} type="button">
              {copy.hearAgain}
            </button>
            <button onClick={onRestartWord} type="button">
              {copy.restartWord}
            </button>
          </div>
        </section>
      ) : (
        <OnScreenKeyboard
          onKeyPress={onKeyPress}
          pressedKey={pressedKey}
          rejectedKey={rejectedKey}
          showAccentRow={containsAccentKey(item.targetSequence)}
          locale={lessonLocale}
        />
      )}
    </main>
  );
}

function getLessonLocaleName(
  locale: LessonLocale,
  interfaceLocale: LessonLocale,
): string {
  if (interfaceLocale === "en-GB") {
    if (locale === "pt-PT") {
      return "European Portuguese";
    }

    if (locale === "pt-BR") {
      return "Brazilian Portuguese";
    }

    return "British English";
  }

  if (locale === "en-GB") {
    return "British English";
  }
  return locale === "pt-BR" ? "Português do Brasil" : "Português europeu";
}

function getLessonLocaleRegion(
  locale: LessonLocale,
  interfaceLocale: LessonLocale,
): string {
  if (interfaceLocale === "en-GB") {
    if (locale === "pt-BR") {
      return "Brazil";
    }

    if (locale === "pt-PT") {
      return "Portugal";
    }

    return "United Kingdom";
  }

  if (locale === "en-GB") {
    return "United Kingdom";
  }

  return locale === "pt-BR" ? "Brasil" : "Portugal";
}

function getLessonLocaleFlag(locale: LessonLocale): string {
  if (locale === "en-GB") {
    return "🇬🇧";
  }

  return locale === "pt-BR" ? "🇧🇷" : "🇵🇹";
}

function getLessonCopy(locale: LessonLocale) {
  if (locale === "en-GB") {
    return {
      audioCueLabel: "You hear",
      backToStages: "Choose a stage",
      home: "Stages",
      close: "Close",
      completions: (count: number) => `${count} completions`,
      currentLessonLabel: "Current lesson",
      languageVariantLegend: "Lesson language",
      learningAreaLabel: "Learning area",
      lessonComplete: "Lesson complete",
      lessonLanguageLabel: "Lesson language",
      lessonNavigationLabel: "Lesson navigation",
      lessonProgressLabel: "Lesson progress",
      lettersCompletedLabel: "Letters completed",
      lettersOfWordLabel: "Letters in word",
      letterBoxLabel: (
        index: number,
        total: number,
        typedLetter: string | null,
      ) =>
        `Letter ${index} of ${total}${typedLetter ? `, ${typedLetter}` : ", empty"}`,
      localMode: "Local mode",
      localProgress: (progress: string) => `On this device: ${progress}`,
      nextWord: "Next word",
      nextWordArrow: "Go to next word",
      previousWord: "Previous word",
      nextShort: "Next",
      skipToNextWord: "Next word without finishing this one",
      wordSuccessTitle: "Well done!",
      wordSuccessBody: (word: string) => `${word} is complete.`,
      hearAgain: "Hear the word again",
      listEndTitle: "More words to practise",
      unfinishedBody: (count: number) =>
        `${count} ${count === 1 ? "word is" : "words are"} still waiting for you.`,
      reviewUnfinished: "Practise an unfinished word",
      hearWord: "Hear the word",
      restartWord: "Start word again",
      skipWord: "Try another word",
      typeInstruction: "Type the word one letter at a time.",
      wordAnnouncement: (current: number, total: number, word: string) =>
        `Word ${current} of ${total}: ${word}.`,
      nextStage: "Next stage",
      oneCompletion: "1 completion",
      previous: "Previous",
      privacyNote: "No accounts, no cloud. Saved only on this device.",
      progressCount: (current: number, total: number) =>
        `${current} of ${total}`,
      replay: "Listen again",
      replayDisabled: "Type one letter to listen again.",
      replayEnabled: (text: string) => `Will play ${text}.`,
      settings: "Settings",
      stageCompleteTitle: "Stage complete!",
      stageCompleteBody:
        "You put every word together. Come back to practise whenever you like.",
      sound: "Sound",
      soundVolume: "Sound volume",
      syllablesLabel: "Word parts",
      tagline: "Listen. Read. Type.",
      targetWordLabel: "Target word",
      variantPrefix: "Lesson language",
      voiceUnavailable: "Voice unavailable in this browser.",
      wordComplete: "Word complete",
      wordLabel: "Word",
      wordPosition: (current: number, total: number) =>
        `Word ${current} of ${total}`,
    };
  }

  return {
    audioCueLabel: "Ouves",
    backToStages: "Escolher etapa",
    home: "Etapas",
    close: "Fechar",
    completions: (count: number) => `${count} conclusões`,
    currentLessonLabel: "Lição atual",
    languageVariantLegend: "Variante de português",
    learningAreaLabel: "Área de aprendizagem",
    lessonComplete: "Lição completa",
    lessonLanguageLabel: "Idioma da lição",
    lessonNavigationLabel: "Navegação da lição",
    lessonProgressLabel: "Progresso da lição",
    lettersCompletedLabel: "Letras concluídas",
    lettersOfWordLabel: "Letras da palavra",
    letterBoxLabel: (
      index: number,
      total: number,
      typedLetter: string | null,
    ) =>
      `Letra ${index} de ${total}${typedLetter ? `, ${typedLetter}` : ", vazia"}`,
    localMode: "Modo local",
    localProgress: (progress: string) => `Neste dispositivo: ${progress}`,
    nextWord: "Próxima palavra",
    nextWordArrow: "Palavra seguinte",
    previousWord: "Palavra anterior",
    nextShort: "Seguinte",
    skipToNextWord: "Palavra seguinte sem concluir esta",
    wordSuccessTitle: "Muito bem!",
    wordSuccessBody: (word: string) => `${word} está completa.`,
    hearAgain: "Ouvir a palavra outra vez",
    listEndTitle: "Há mais palavras para praticar",
    unfinishedBody: (count: number) =>
      `Ainda tens ${count} ${count === 1 ? "palavra" : "palavras"} para praticar.`,
    reviewUnfinished: "Praticar palavra em falta",
    hearWord: "Ouvir palavra",
    restartWord: "Recomeçar palavra",
    skipWord: "Tentar outra palavra",
    typeInstruction: "Escreve a palavra, uma letra de cada vez.",
    wordAnnouncement: (current: number, total: number, word: string) =>
      `Palavra ${current} de ${total}: ${word}.`,
    nextStage: "Etapa seguinte",
    oneCompletion: "1 conclusão",
    previous: "Anterior",
    privacyNote: "Sem contas, sem nuvem. Guardado só neste dispositivo.",
    progressCount: (current: number, total: number) => `${current} de ${total}`,
    replay: "Ouvir outra vez",
    replayDisabled: "Escreve uma letra para ouvir outra vez.",
    replayEnabled: (text: string) => `Vai ouvir ${text}.`,
    settings: "Definições",
    stageCompleteTitle: "Etapa concluída!",
    stageCompleteBody:
      "Juntaste todas as palavras. Podes voltar para praticar quando quiseres.",
    sound: "Som",
    soundVolume: "Volume do som",
    syllablesLabel: "Sílabas",
    tagline: "Ouve. Lê. Escreve.",
    targetWordLabel: "Palavra alvo",
    variantPrefix: "Variante portuguesa",
    voiceUnavailable: "Voz indisponível neste navegador.",
    wordComplete: "Palavra completa",
    wordLabel: "Palavra",
    wordPosition: (current: number, total: number) =>
      `Palavra ${current} de ${total}`,
  };
}

function trapDialogFocus(
  event: ReactKeyboardEvent<HTMLElement>,
  container: HTMLElement | null,
): void {
  if (!container) {
    return;
  }

  const focusableElements = Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled"));

  if (focusableElements.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === container) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function getCurrentSyllableIndex(
  item: CurriculumItem,
  cursorIndex: number,
): number {
  if (!item.syllables?.length) {
    return -1;
  }

  let boundary = 0;
  for (let index = 0; index < item.syllables.length; index += 1) {
    boundary += item.syllables[index].length;
    if (cursorIndex < boundary) {
      return index;
    }
  }

  return item.syllables.length - 1;
}
