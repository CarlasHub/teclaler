import type { Ref } from "react";
import type { CurriculumItem } from "../../curriculum/types";
import { containsAccentKey, displayKey } from "../../engine/inputEngine";
import type { LessonState } from "../../engine/lessonEngine";
import { OnScreenKeyboard } from "../OnScreenKeyboard";

interface LessonScreenProps {
  item: CurriculumItem;
  lessonPosition: {
    current: number;
    total: number;
  };
  lessonState: LessonState;
  currentKey: string | null;
  audioCue: string | null;
  feedbackMessage: string | null;
  learningInputRef: Ref<HTMLElement>;
  localCompletionCount: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onKeyPress: (key: string) => void;
  onNextLesson: () => void;
  onPreviousLesson: () => void;
  onReplay: () => void;
}

export function LessonScreen({
  item,
  lessonPosition,
  lessonState,
  currentKey,
  audioCue,
  feedbackMessage,
  learningInputRef,
  localCompletionCount,
  canGoNext,
  canGoPrevious,
  onKeyPress,
  onNextLesson,
  onPreviousLesson,
  onReplay,
}: LessonScreenProps) {
  const totalLetters = lessonState.targetSequence.length;
  const progressText = lessonState.completed
    ? "Palavra completa"
    : `${lessonState.cursorIndex} de ${totalLetters}`;
  const lessonCompleted =
    lessonState.completed && lessonPosition.current === lessonPosition.total;
  const currentSyllableIndex = getCurrentSyllableIndex(
    item,
    lessonState.cursorIndex,
  );
  const localProgressText =
    localCompletionCount === 1
      ? "1 conclusão"
      : `${localCompletionCount} conclusões`;
  const imageSrc =
    item.imageId === "image.house.simple" ? "/images/house-simple.svg" : null;

  return (
    <main
      aria-label="Área de aprendizagem"
      aria-labelledby="app-title"
      className="lesson-shell"
      data-testid="learning-input-area"
      ref={learningInputRef}
      tabIndex={-1}
    >
      <header className="brand-header">
        <div>
          <h1 id="app-title">
            <span>Tecla</span>
            <span className="brand-header__green">Ler</span>
          </h1>
          <p>Ouve. Lê. Escreve.</p>
        </div>
        <p className="locale-pill" aria-label="Variante portuguesa">
          pt-PT
        </p>
      </header>

      <section
        className={`lesson-stage${imageSrc ? "" : " lesson-stage--text-only"}`}
        aria-label="Lição atual"
      >
        {imageSrc ? (
          <div className="meaning-visual" aria-hidden="true">
            <img src={imageSrc} alt="" />
          </div>
        ) : null}

        <div className="lesson-focus">
          <p className="lesson-focus__label">Palavra</p>
          <div
            className="target-word"
            aria-label={`Palavra alvo ${item.displayText}`}
          >
            {item.displayText}
          </div>

          <div
            className="syllables"
            aria-label={`Sílabas ${item.syllables?.join(" ") ?? ""}`}
          >
            {item.syllables?.map((syllable, index) => (
              <span
                className={`syllables__item${lessonState.completedSyllableIndexes.includes(index) ? " syllables__item--complete" : ""}${index === currentSyllableIndex ? " syllables__item--current" : ""}`}
                key={syllable}
              >
                {syllable.toLocaleUpperCase("pt-PT")}
              </span>
            ))}
          </div>

          <div
            className="typing-boxes"
            role="list"
            aria-label={`Letras da palavra ${item.displayText}`}
          >
            {lessonState.targetSequence.map((expected, index) => {
              const typedLetter = lessonState.typed[index];
              const isCurrent =
                index === lessonState.cursorIndex && !lessonState.completed;

              return (
                <div
                  aria-label={`Letra ${index + 1} de ${totalLetters}${typedLetter ? `, ${displayKey(typedLetter)}` : ", vazia"}`}
                  className={`typing-box${isCurrent ? " typing-box--current" : ""}${typedLetter ? " typing-box--filled" : ""}`}
                  key={`${expected}-${index}`}
                  role="listitem"
                >
                  {typedLetter ? displayKey(typedLetter) : ""}
                </div>
              );
            })}
          </div>

          <div className="cue-row" aria-live="polite">
            <div className="audio-cue">
              <span className="audio-cue__label">Ouves</span>
              <strong>
                {audioCue ?? (currentKey ? displayKey(currentKey) : item.text)}
              </strong>
            </div>
            <button className="replay-button" onClick={onReplay} type="button">
              Ouvir outra vez
            </button>
          </div>

          {feedbackMessage ? (
            <p className="gentle-feedback" aria-live="polite">
              {feedbackMessage}
            </p>
          ) : null}
        </div>
      </section>

      <section className="lesson-status" aria-label="Progresso da lição">
        <p>
          Palavra {lessonPosition.current} de {lessonPosition.total}
        </p>
        <progress
          aria-label="Letras concluídas"
          max={totalLetters}
          value={lessonState.cursorIndex}
        />
        <p>{progressText}</p>
        {lessonCompleted ? (
          <p className="lesson-complete">Lição completa</p>
        ) : null}
        <p className="local-progress">Neste dispositivo: {localProgressText}</p>
      </section>

      <nav className="lesson-nav" aria-label="Navegação da lição">
        <button
          className="lesson-nav__button"
          disabled={!canGoPrevious}
          onClick={onPreviousLesson}
          type="button"
        >
          Anterior
        </button>
        <button
          className="lesson-nav__button lesson-nav__button--primary"
          disabled={!canGoNext}
          onClick={onNextLesson}
          type="button"
        >
          Próxima palavra
        </button>
      </nav>

      <OnScreenKeyboard
        currentKey={currentKey}
        onKeyPress={onKeyPress}
        showAccentRow={containsAccentKey(item.targetSequence)}
      />
    </main>
  );
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
