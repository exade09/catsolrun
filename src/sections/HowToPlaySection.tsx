import type { IconName } from "../components";
import { Icon, SectionIntro } from "../components";

interface ControlItem {
  icon: IconName;
  label: string;
  description: string;
  keys: string[];
}

const controls: ControlItem[] = [
  {
    icon: "lanes",
    label: "Switch lanes",
    description: "Read ahead and move into a clear line.",
    keys: ["A", "D", "Left", "Right"],
  },
  {
    icon: "arrow-up",
    label: "Jump",
    description: "Clear walls, gaps, and low hazards.",
    keys: ["W", "Space", "Up"],
  },
  {
    icon: "arrow-down",
    label: "Slide",
    description: "Duck below gates and high barriers.",
    keys: ["S", "Down"],
  },
];

const runSkills = [
  { icon: "coin" as const, title: "Collect SOL", text: "Trace pickup lines to raise your score." },
  { icon: "spark" as const, title: "Build combos", text: "Keep collecting without breaking the trail." },
  { icon: "shield" as const, title: "Use power-ups", text: "Turn a tight route into a smart advantage." },
  { icon: "speed" as const, title: "Stay readable", text: "Watch silhouettes and react to warning pulses." },
];

export function HowToPlaySection() {
  return (
    <section className="controls-section section-space" id="how-to-play" aria-labelledby="controls-title">
      <div className="section-shell">
        <div className="controls-section__header">
          <SectionIntro
            eyebrow="How to play"
            title={<>Move on instinct.<br />Plan one beat ahead.</>}
            description="Keyboard, arrows, or touch gestures - the same compact move set works everywhere."
            id="controls-title"
          />
          <div className="controls-section__swipe" aria-label="Touch controls supported">
            <span className="controls-section__swipe-track" aria-hidden="true"><i /></span>
            <span><strong>On touch</strong>Swipe in the direction you want to move.</span>
          </div>
        </div>

        <div className="control-deck">
          {controls.map((control, index) => (
            <article className="control-deck__item" key={control.label}>
              <span className="control-deck__number">0{index + 1}</span>
              <div className="control-deck__icon"><Icon name={control.icon} /></div>
              <div className="control-deck__copy">
                <h3>{control.label}</h3>
                <p>{control.description}</p>
              </div>
              <div className="control-deck__keys" aria-label={`${control.label} keys`}>
                {control.keys.map((key) => <kbd key={key}>{key}</kbd>)}
              </div>
            </article>
          ))}
        </div>

        <div className="run-skills">
          {runSkills.map((skill) => (
            <article key={skill.title}>
              <Icon name={skill.icon} />
              <div><h3>{skill.title}</h3><p>{skill.text}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
