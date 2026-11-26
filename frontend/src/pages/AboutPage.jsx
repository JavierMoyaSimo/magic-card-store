import { Link } from "react-router";
import { usePageTitle } from "../hooks/usePageTitle.js";
import {
  DECISIONS,
  PROFILE_URL,
  REPO_URL,
  ROADMAP,
  TECH_GROUPS,
} from "../aboutData.js";

function AboutPage() {
  usePageTitle("Sobre el proyecto");

  return (
    <article className="about">
      <header className="about-hero">
        <p className="eyebrow">Proyecto de portfolio</p>
        <h2>Magic Card Store</h2>
        <p className="about-lead">
          Una tienda online de cartas de <em>Magic: The Gathering</em>,
          inspirada en CardMarket y construida de punta a punta: interfaz en
          React, API en Node y Express, base de datos en MongoDB y
          reconocimiento de cartas por foto con la API de Claude.
        </p>
        <div className="hero-actions">
          <a
            className="button-link"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            Ver el código en GitHub
          </a>
          <Link className="button-link" to="/">
            Ir a la tienda
          </Link>
        </div>
      </header>

      <section className="panel about-section" aria-labelledby="about-arch">
        <h3 id="about-arch">Arquitectura</h3>

        <figure className="arch">
          <div className="arch-grid">
            <div className="arch-node">
              <strong>Navegador</strong>
              <span>React, Vite y React Router</span>
            </div>
            <span className="arch-arrow" aria-hidden="true">
              →
            </span>
            <div className="arch-node">
              <strong>API</strong>
              <span>Node y Express</span>
            </div>
            <span className="arch-arrow" aria-hidden="true">
              →
            </span>
            <div className="arch-node">
              <strong>Base de datos</strong>
              <span>MongoDB Atlas</span>
            </div>

            <div className="arch-below">
              <span className="arch-arrow" aria-hidden="true">
                →
              </span>
              <div className="arch-node">
                <strong>Scryfall</strong>
                <span>Datos e imágenes de cartas</span>
              </div>
              <div className="arch-node">
                <strong>API de Claude</strong>
                <span>Lee el nombre de una carta en una foto</span>
              </div>
            </div>
          </div>

          <figcaption>
            El navegador solo habla con la API. La API consulta la base de datos
            y, únicamente desde el servidor, a Scryfall y a Claude: las claves
            nunca llegan al navegador.
          </figcaption>
        </figure>
      </section>

      <section className="panel about-section" aria-labelledby="about-tech">
        <h3 id="about-tech">Tecnologías</h3>
        <div className="tech-grid">
          {TECH_GROUPS.map((group) => (
            <div key={group.title} className="tech-group">
              <h4>{group.title}</h4>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section
        className="panel about-section"
        aria-labelledby="about-decisions"
      >
        <h3 id="about-decisions">Decisiones técnicas</h3>
        <ul className="decision-list">
          {DECISIONS.map((decision) => (
            <li key={decision.title} className="decision">
              <h4>{decision.title}</h4>
              <p>{decision.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel about-section" aria-labelledby="about-how">
        <h3 id="about-how">Cómo lo construí</h3>
        <p>
          Lo desarrollé paso a paso con Claude como tutor y compañero de
          programación. Revisé, probé y depuré cada parte por mi cuenta, y puedo
          explicar cada archivo: el arranque en frío del servidor gratuito, el
          redimiento percibido...
        </p>
      </section>

      <section className="panel about-section" aria-labelledby="about-next">
        <h3 id="about-next">Próximos pasos</h3>
        <ul className="about-list">
          {ROADMAP.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="hint">
          Más proyectos en{" "}
          <a href={PROFILE_URL} target="_blank" rel="noreferrer">
            mi perfil de GitHub
          </a>
          .
        </p>
      </section>
    </article>
  );
}

export default AboutPage;
