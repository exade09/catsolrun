import catProfile from "../assets/poses/meowave-profile.jpg";
import catRear from "../assets/poses/meowave-rear.jpg";
import catRest from "../assets/poses/meowave-rest.jpg";
import { Icon, SectionIntro } from "../components";

export function StorySection() {
  return (
    <section className="story-section section-space" id="story" aria-labelledby="story-title">
      <div className="section-shell story-section__layout">
        <div className="story-visual">
          <div className="story-visual__index" aria-hidden="true">01 / ORIGIN</div>
          <div className="story-visual__image">
            <img
              src={catRest}
              alt="Meowave, a low-poly orange-and-white cat resting in oversized headphones"
              loading="lazy"
            />
          </div>
          <div className="story-visual__angles" aria-label="Meowave character reference angles">
            <figure>
              <img src={catProfile} alt="Profile reference view of Meowave" loading="lazy" />
              <figcaption>Profile / 02</figcaption>
            </figure>
            <figure>
              <img src={catRear} alt="Rear reference view of Meowave" loading="lazy" />
              <figcaption>Rear / 03</figcaption>
            </figure>
          </div>
          <div className="story-visual__note">
            <Icon name="headphones" />
            <span>
              <strong>Always listening</strong>
              An old player. A new frequency
            </span>
          </div>
          <span className="story-visual__facet story-visual__facet--one" aria-hidden="true" />
          <span className="story-visual__facet story-visual__facet--two" aria-hidden="true" />
        </div>

        <div className="story-section__copy">
          <SectionIntro
            eyebrow="The signal"
            title={<>A quiet cat<br />A world turned loud</>}
            id="story-title"
          />
          <div className="story-section__prose">
            <p>
              Every day, the cat sat beside a forgotten portable player, listening to the same
              worn tape and watching the concrete world drift by
            </p>
            <p>
              Then, one night, a Solana signal entered the headphones. It opened a geometric
              world built from rhythm, speed, and glowing fragments. Now Meowave runs through
              the chain, collecting lost SOL notes before the signal fades
            </p>
          </div>
          <blockquote>
            <span aria-hidden="true">&quot;</span>
            The route changes. The beat remembers
          </blockquote>
          <dl className="story-section__traits">
            <div><dt>Temper</dt><dd>Calm</dd></div>
            <div><dt>Focus</dt><dd>Unbroken</dd></div>
            <div><dt>Frequency</dt><dd>Locked</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}
