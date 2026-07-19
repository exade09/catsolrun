import { Icon, SectionIntro } from "../components";

export function FeaturesSection() {
  return (
    <section className="features-section section-space" id="features" aria-labelledby="features-title">
      <div className="section-shell">
        <div className="features-section__heading">
          <SectionIntro
            eyebrow="Built for flow"
            title={<>A small move set<br />A deep run</>}
            description="Every system is tuned around legibility, rhythm, and that one-more-run feeling"
            id="features-title"
          />
          <p className="features-section__aside">No downloads. No transaction. Just press play</p>
        </div>

        <div className="feature-grid">
          <article className="feature feature--world">
            <div className="feature__copy">
              <span className="feature__number">01</span>
              <h3>The world builds ahead</h3>
              <p>Modular routes assemble into concrete plazas, tunnels, and signal corridors as you move</p>
            </div>
            <div className="route-art" aria-hidden="true">
              <span className="route-art__sun" />
              <span className="route-art__lane route-art__lane--one" />
              <span className="route-art__lane route-art__lane--two" />
              <span className="route-art__lane route-art__lane--three" />
              <i /><i /><i />
            </div>
          </article>

          <article className="feature feature--power">
            <span className="feature__number">02</span>
            <div className="power-orbit" aria-hidden="true">
              <span><Icon name="magnet" /></span>
              <span><Icon name="shield" /></span>
              <span><Icon name="pulse" /></span>
            </div>
            <h3>Power in the pocket</h3>
            <p>Magnetize SOL, absorb a hit, slow time, or push the score multiplier into overdrive</p>
          </article>

          <article className="feature feature--rhythm">
            <span className="feature__number">03</span>
            <div className="rhythm-art" aria-hidden="true">
              {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
            </div>
            <h3>The route has a pulse</h3>
            <p>Reactive lights, restrained audio cues, and pickup patterns make the safest line feel musical</p>
          </article>

          <article className="feature feature--adaptive">
            <div className="feature__copy">
              <span className="feature__number">04</span>
              <h3>Fast where it matters</h3>
              <p>Adaptive quality, lightweight geometry, touch controls, and reduced-motion support keep the run focused across devices</p>
            </div>
            <div className="adaptive-art" aria-hidden="true">
              <span className="adaptive-art__desktop"><i /></span>
              <span className="adaptive-art__phone"><i /></span>
              <span className="adaptive-art__signal"><i /><i /><i /></span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
