import { useEffect, useRef } from "react";
import type { LessonLocale } from "../../curriculum/types";

export interface HomeStage {
  id: number;
  title: string;
  description: string;
  total: number;
  completed: number;
  examples: string[];
}

interface HomeScreenProps {
  locale: LessonLocale;
  stages: HomeStage[];
  selectedStage: number;
  resumeWord: string | null;
  onLocaleChange: (locale: LessonLocale) => void;
  onStartStage: (stage: number) => void;
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

      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__copy">
          <p className="home-eyebrow">
            {english ? "READ · TYPE · LISTEN" : "LER · ESCREVER · OUVIR"}
          </p>
          <h1 id="home-title">
            {english ? "Read. Type. Discover." : "Lê. Escreve. Descobre."}
          </h1>
          <p className="home-hero__intro">
            {english
              ? "See the word, type its letters and hear it come together. Take your time."
              : "Vê a palavra, escreve as letras e ouve os sons a formar-se. Ao teu ritmo."}
          </p>
          <button
            className="home-hero__start"
            onClick={() => onStartStage(currentStage.id)}
            type="button"
          >
            {resumeWord
              ? english
                ? `Continue with ${resumeWord}`
                : `Continuar em ${resumeWord}`
              : english
                ? "Start learning"
                : "Começar a aprender"}
            <span aria-hidden="true">→</span>
          </button>
          <p className="home-hero__hint">
            {english
              ? "Works with your keyboard or the on-screen keys."
              : "Usa o teclado do computador ou as teclas no ecrã."}
          </p>
        </div>
        <div className="home-hero__art" aria-hidden="true">
          <span className="home-art__sun" />
          <span className="home-art__tile home-art__tile--one">C</span>
          <span className="home-art__tile home-art__tile--two">A</span>
          <span className="home-art__tile home-art__tile--three">S</span>
          <span className="home-art__tile home-art__tile--four">A</span>
          <span className="home-art__underline" />
        </div>
      </section>

      <section className="home-stages" aria-labelledby="home-stages-title">
        <div className="home-stages__heading">
          <div>
            <p className="home-eyebrow">
              {english ? "YOUR JOURNEY" : "O TEU PERCURSO"}
            </p>
            <h2 id="home-stages-title">
              {english ? "Choose a stage" : "Escolhe uma etapa"}
            </h2>
          </div>
          <p>
            {english
              ? "You can practise any stage."
              : "Podes praticar qualquer etapa."}
          </p>
        </div>
        <div className="home-stages__grid">
          {stages.map((stage) => (
            <button
              className="home-stage-card"
              key={stage.id}
              onClick={() => onStartStage(stage.id)}
              type="button"
            >
              <span className="visually-hidden">
                {english ? "Stage" : "Etapa"} {stage.id}
              </span>
              <span className="home-stage-card__top">
                <span className="home-stage-card__number" aria-hidden="true">
                  {String(stage.id).padStart(2, "0")}
                </span>
                <span className="home-stage-card__arrow" aria-hidden="true">
                  ↗
                </span>
              </span>
              <strong>{stage.title}</strong>
              <span className="home-stage-card__description">
                {stage.description}
              </span>
              <span className="home-stage-card__examples" aria-hidden="true">
                {stage.examples.join(" · ")}
              </span>
              <span className="home-stage-card__progress">
                <span>
                  {english
                    ? `${stage.completed}/${stage.total} words`
                    : `${stage.completed}/${stage.total} palavras`}
                </span>
                <span className="home-stage-card__track" aria-hidden="true">
                  <span
                    style={{
                      width: `${(stage.completed / stage.total) * 100}%`,
                    }}
                  />
                </span>
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
