import { useEffect, useRef } from "react";
import type { LessonLocale } from "../../curriculum/types";

export interface HomeStage {
  id: number;
  title: string;
  total: number;
  completed: number;
}

interface HomeScreenProps {
  locale: LessonLocale;
  stages: HomeStage[];
  selectedStage: number;
  resumeWord: string | null;
  onLocaleChange: (locale: LessonLocale) => void;
  onStartStage: (stage: number) => void;
}

function StageIcon({ stage }: { stage: number }) {
  if (stage === 2) {
    return (
      <svg viewBox="0 0 64 64" fill="none" focusable="false" aria-hidden="true">
        <rect x="5" y="15" width="25" height="33" rx="6" />
        <rect x="34" y="15" width="25" height="33" rx="6" />
        <text x="17.5" y="37" textAnchor="middle">
          CA
        </text>
        <text x="46.5" y="37" textAnchor="middle">
          SA
        </text>
      </svg>
    );
  }
  if (stage === 3) {
    return (
      <svg viewBox="0 0 64 64" fill="none" focusable="false" aria-hidden="true">
        <path d="M8 48h48" />
        <text x="32" y="45" textAnchor="middle">
          Á
        </text>
      </svg>
    );
  }
  if (stage === 4) {
    return (
      <svg viewBox="0 0 64 64" fill="none" focusable="false" aria-hidden="true">
        <path d="M32 16c-8-5-17-5-26-2v35c9-3 18-3 26 2 8-5 17-5 26-2V14c-9-3-18-3-26 2Z" />
        <path d="M32 16v35M12 23c5-1 10-1 15 1M37 24c5-2 10-2 15-1M12 31c5-1 10-1 15 1M37 32c5-2 10-2 15-1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" fill="none" focusable="false" aria-hidden="true">
      <rect x="9" y="8" width="46" height="48" rx="8" />
      <path d="M16 43h32" />
      <text x="32" y="39" textAnchor="middle">
        A
      </text>
    </svg>
  );
}

export function HomeScreen({
  locale,
  stages,
  selectedStage,
  resumeWord,
  onLocaleChange,
  onStartStage,
}: HomeScreenProps) {
  const homeRef = useRef<HTMLElement>(null);
  const english = locale === "en-GB";
  const currentStage =
    stages.find((stage) => stage.id === selectedStage) ?? stages[0];

  useEffect(() => {
    homeRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <main
      className="home-shell"
      ref={homeRef}
      tabIndex={-1}
      aria-labelledby="home-title"
    >
      <header className="home-header">
        <div className="home-brand" aria-label="TeclaLer">
          <span>Tecla</span>
          <span>Ler</span>
        </div>
        <label className="home-language">
          <span>{english ? "Language" : "Idioma"}</span>
          <select
            aria-label={english ? "Lesson language" : "Idioma da lição"}
            value={locale}
            onChange={(event) =>
              onLocaleChange(event.currentTarget.value as LessonLocale)
            }
          >
            <option value="pt-PT">Português europeu</option>
            <option value="pt-BR">Português do Brasil</option>
            <option value="en-GB">British English</option>
          </select>
        </label>
      </header>

      <section className="home-welcome" aria-labelledby="home-title">
        <div className="home-welcome__icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none" focusable="false">
            <path d="M32 16c-8-5-17-5-26-2v35c9-3 18-3 26 2 8-5 17-5 26-2V14c-9-3-18-3-26 2Z" />
            <path d="M32 16v35M14 24l4 4 8-10M39 25h12M39 33h12" />
          </svg>
        </div>
        <div className="home-welcome__copy">
          <h1 id="home-title">{english ? "Let's read!" : "Vamos ler?"}</h1>
          <p>
            {english
              ? "Choose a stage and type the words."
              : "Escolhe uma etapa e escreve as palavras."}
          </p>
        </div>
        <button
          className="home-welcome__start"
          onClick={() => onStartStage(currentStage.id)}
          type="button"
        >
          <span>
            {resumeWord
              ? english
                ? `Continue with ${resumeWord}`
                : `Continuar em ${resumeWord}`
              : english
                ? "Start learning"
                : "Começar a aprender"}
          </span>
          <span aria-hidden="true">→</span>
        </button>
      </section>

      <section className="home-stages" aria-labelledby="home-stages-title">
        <h2 id="home-stages-title">
          {english ? "Choose a stage" : "Escolhe uma etapa"}
        </h2>
        <div className="home-stages__grid">
          {stages.map((stage) => (
            <button
              className="home-stage-card"
              key={stage.id}
              onClick={() => onStartStage(stage.id)}
              type="button"
            >
              <span className="home-stage-card__icon">
                <StageIcon stage={stage.id} />
              </span>
              <span className="home-stage-card__body">
                <span className="home-stage-card__step">
                  {english ? "Stage" : "Etapa"} {stage.id}
                </span>
                <strong>{stage.title}</strong>
                <span className="home-stage-card__count">
                  {english
                    ? `${stage.completed} of ${stage.total} words`
                    : `${stage.completed} de ${stage.total} palavras`}
                </span>
              </span>
              <span className="home-stage-card__arrow" aria-hidden="true">
                →
              </span>
              <span className="home-stage-card__track" aria-hidden="true">
                <span
                  style={{ width: `${(stage.completed / stage.total) * 100}%` }}
                />
              </span>
            </button>
          ))}
        </div>
      </section>
      <p className="home-privacy">
        {english
          ? "Your progress stays on this device."
          : "O teu progresso fica só neste dispositivo."}
      </p>
    </main>
  );
}
