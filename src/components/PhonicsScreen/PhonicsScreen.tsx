import { useEffect, useRef, useState } from "react";
import type { CurriculumItem, LessonLocale } from "../../curriculum/types";
import {
  blendPhonics,
  canBlendPhonics,
  createPhonicsState,
  selectPhonicsPart,
} from "../../engine/phonicsEngine";
import { resolvePublicAssetPath } from "../../platform/publicPath";

interface PhonicsScreenProps {
  item: CurriculumItem;
  audioUnavailable: boolean;
  position: { current: number; total: number };
  selectedStage: number;
  stageOptions: readonly { id: number; title: string }[];
  canGoPrevious: boolean;
  canGoNext: boolean;
  onHome: () => void;
  onStageChange: (stage: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onHearWord: () => void;
  onHearPart: (index: number) => void;
  onBlend: () => Promise<void>;
  onTypeWord: () => void;
}

export function PhonicsScreen({
  item,
  audioUnavailable,
  position,
  selectedStage,
  stageOptions,
  canGoPrevious,
  canGoNext,
  onHome,
  onStageChange,
  onPrevious,
  onNext,
  onHearWord,
  onHearPart,
  onBlend,
  onTypeWord,
}: PhonicsScreenProps) {
  const mainRef = useRef<HTMLElement>(null);
  const [state, setState] = useState(createPhonicsState);
  const [blending, setBlending] = useState(false);
  const [message, setMessage] = useState("");
  const copy = getPhonicsCopy(item.locale);
  const parts = item.syllables ?? [];
  const canBlend = canBlendPhonics(state, parts.length);

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, []);

  const hearPart = (index: number) => {
    const result = selectPhonicsPart(state, index, parts.length);
    if (result.selection !== "ahead") onHearPart(index);
    setState(result.state);
    setMessage(
      result.selection === "ahead"
        ? copy.startWith(parts[state.nextPartIndex])
        : result.state.nextPartIndex === parts.length
          ? copy.readyToBlend
          : copy.nextPart(parts[result.state.nextPartIndex]),
    );
  };

  const hearBlend = async () => {
    if (!canBlend || blending) return;
    setBlending(true);
    await onBlend();
    setState((current) => blendPhonics(current, parts.length));
    setMessage(copy.blended);
    setBlending(false);
  };

  return (
    <main
      aria-labelledby="phonics-title"
      className="phonics-shell"
      ref={mainRef}
      tabIndex={-1}
    >
      <header className="phonics-header">
        <div className="home-brand" aria-label="TeclaLer">
          <span>Tecla</span>
          <span>Ler</span>
        </div>
        <button className="phonics-home" onClick={onHome} type="button">
          <span aria-hidden="true">←</span> {copy.stages}
        </button>
      </header>

      <div className="phonics-intro">
        <div>
          <p className="phonics-eyebrow">{copy.sectionName}</p>
          <h1 id="phonics-title">{copy.title}</h1>
          <p>{copy.intro}</p>
          {audioUnavailable ? (
            <p className="audio-unavailable" role="status">
              {copy.voiceUnavailable}
            </p>
          ) : null}
        </div>
        {stageOptions.length > 0 ? (
          <label className="phonics-stage-select">
            <span>{copy.stage}</span>
            <select
              aria-label={copy.stage}
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
          </label>
        ) : null}
      </div>

      <section aria-label={copy.currentWord} className="phonics-word-card">
        <p className="visually-hidden" role="status">
          {copy.wordAnnouncement(
            position.current,
            position.total,
            item.displayText,
          )}
        </p>
        <div className="phonics-word-nav">
          <button
            aria-label={copy.previousWord}
            disabled={!canGoPrevious}
            onClick={onPrevious}
            type="button"
          >
            ←
          </button>
          <span>{copy.position(position.current, position.total)}</span>
          <button
            aria-label={copy.nextWord}
            disabled={!canGoNext}
            onClick={onNext}
            type="button"
          >
            →
          </button>
        </div>
        <div className="phonics-word-body">
          {item.imageAsset ? (
            <img
              alt={item.imageAlt ?? ""}
              className="phonics-illustration"
              src={resolvePublicAssetPath(item.imageAsset)}
            />
          ) : null}
          <div>
            <p className="phonics-word-label">{copy.word}</p>
            <div
              aria-label={`${copy.targetWord} ${item.displayText}`}
              className="phonics-target"
            >
              {item.displayText}
            </div>
            <button
              className="phonics-hear-word"
              disabled={blending}
              onClick={onHearWord}
              type="button"
            >
              <span aria-hidden="true">♫</span> {copy.hearWord}
            </button>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="phonics-parts-title"
        className="phonics-practice"
      >
        <div className="phonics-step-number" aria-hidden="true">
          1
        </div>
        <div className="phonics-practice-body">
          <h2 id="phonics-parts-title">{copy.hearParts}</h2>
          <p>{copy.hearPartsInstruction}</p>
          <div className="phonics-parts">
            {parts.map((part, index) => (
              <button
                aria-label={copy.partLabel(index + 1, part)}
                aria-pressed={index < state.nextPartIndex}
                className={`phonics-part${index < state.nextPartIndex ? " phonics-part--heard" : ""}${index === state.nextPartIndex ? " phonics-part--next" : ""}`}
                disabled={blending}
                key={`${part}-${index}`}
                onClick={() => hearPart(index)}
                type="button"
              >
                <span aria-hidden="true">♫</span>{" "}
                {part.toLocaleUpperCase(item.locale)}
              </button>
            ))}
          </div>
          <p className="phonics-feedback" role="status">
            {message || copy.startPrompt}
          </p>
        </div>
      </section>

      <section
        aria-labelledby="phonics-blend-title"
        className="phonics-practice"
      >
        <div className="phonics-step-number" aria-hidden="true">
          2
        </div>
        <div className="phonics-practice-body">
          <h2 id="phonics-blend-title">{copy.blendTitle}</h2>
          <p>{copy.blendInstruction}</p>
          <button
            className="phonics-blend"
            disabled={!canBlend || blending}
            onClick={() => void hearBlend()}
            type="button"
          >
            <span aria-hidden="true">♫</span> {copy.blendButton}
          </button>
        </div>
      </section>

      <div
        aria-label={`${copy.letterGroups}: ${item.graphemes?.join(" ") ?? ""}`}
        className="phonics-graphemes"
      >
        <span>{copy.letterGroups}</span>
        {item.graphemes?.map((group, index) => (
          <span className="phonics-grapheme" key={`${group}-${index}`}>
            {group.toLocaleUpperCase(item.locale)}
          </span>
        ))}
      </div>

      <button className="phonics-type-word" onClick={onTypeWord} type="button">
        {state.blended ? copy.typeAfterBlend : copy.typeWord}
        <span aria-hidden="true">→</span>
      </button>
    </main>
  );
}

function getPhonicsCopy(locale: LessonLocale) {
  if (locale === "en-GB") {
    return {
      sectionName: "Phonics",
      title: "Practise sounds",
      intro: "Hear each part. Put the word together.",
      stages: "Stages",
      stage: "Stage",
      currentWord: "Current phonics word",
      previousWord: "Previous phonics word",
      nextWord: "Next phonics word",
      position: (current: number, total: number) =>
        `Word ${current} of ${total}`,
      wordAnnouncement: (current: number, total: number, word: string) =>
        `Phonics word ${current} of ${total}: ${word}.`,
      word: "Word",
      targetWord: "Target word",
      hearWord: "Hear the whole word",
      hearParts: "Hear each part",
      hearPartsInstruction: "Tap the parts in order.",
      partLabel: (index: number, part: string) => `Hear part ${index}: ${part}`,
      startPrompt: "Start with the first part.",
      startWith: (part: string) => `Start with ${part.toUpperCase()}.`,
      nextPart: (part: string) => `Now hear ${part.toUpperCase()}.`,
      readyToBlend: "Good listening! Now put the word together.",
      blendTitle: "Put it together",
      blendInstruction: "Hear the parts, then the whole word.",
      blendButton: "Blend the word",
      blended: "You put the word together. Try typing it!",
      typeWord: "Type this word",
      typeAfterBlend: "Now type this word",
      letterGroups: "Letters and groups",
      voiceUnavailable: "Sound is unavailable. Check this device's audio output.",
    };
  }
  return {
    sectionName: "Jogo de sons",
    title: "Treinar sons",
    intro: "Ouve as sílabas e junta a palavra.",
    stages: "Etapas",
    stage: "Etapa",
    currentWord: "Palavra para treinar os sons",
    previousWord: "Palavra anterior de sons",
    nextWord: "Palavra seguinte de sons",
    position: (current: number, total: number) =>
      `Palavra ${current} de ${total}`,
    wordAnnouncement: (current: number, total: number, word: string) =>
      `Palavra de sons ${current} de ${total}: ${word}.`,
    word: "Palavra",
    targetWord: "Palavra alvo",
    hearWord: "Ouvir palavra inteira",
    hearParts: "Ouve cada sílaba",
    hearPartsInstruction: "Toca nas sílabas por ordem.",
    partLabel: (index: number, part: string) =>
      `Ouvir sílaba ${index}: ${part.toLocaleUpperCase("pt-PT")}`,
    startPrompt: "Começa pela primeira sílaba.",
    startWith: (part: string) =>
      `Começa por ${part.toLocaleUpperCase("pt-PT")}.`,
    nextPart: (part: string) =>
      `Agora ouve ${part.toLocaleUpperCase("pt-PT")}.`,
    readyToBlend: "Muito bem! Agora junta as sílabas.",
    blendTitle: "Junta as sílabas",
    blendInstruction: "Ouve as sílabas e depois a palavra inteira.",
    blendButton: "Juntar palavra",
    blended: "Juntaste a palavra. Agora podes escrevê-la!",
    typeWord: "Escrever esta palavra",
    typeAfterBlend: "Agora escreve esta palavra",
    letterGroups: "Letras e grupos",
    voiceUnavailable: "O som não está disponível. Verifica a saída de áudio deste dispositivo.",
  };
}
