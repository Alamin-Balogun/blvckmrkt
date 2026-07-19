import {MotionConfig} from "framer-motion";
import HeroIntro from "./HeroIntro";
import StorySection from "./StorySection";
import PersonalizationSection from "./PersonalizationSection";
import {DEFAULT_STORY_LINES} from "./storyDefaults";
import {buildGarments} from "./garmentData";

export default function BrandHeroStory({brand}) {
  const garments = buildGarments(brand);
  if (garments.length === 0) return null;

  const storyLines = [brand.story_line_1, brand.story_line_2, brand.story_line_3];

  return (
    <MotionConfig reducedMotion="user">
      <div style={{position: "relative"}}>
        <HeroIntro brandName={brand.brand_name} garments={garments} />
        {garments.map((garment, i) => (
          <StorySection
            key={i}
            index={i}
            garment={garment}
            headline={(storyLines[i] || "").trim() || DEFAULT_STORY_LINES[i % DEFAULT_STORY_LINES.length]}
          />
        ))}
        <PersonalizationSection brandName={brand.brand_name} image={garments[0].front} />
      </div>
    </MotionConfig>
  );
}
