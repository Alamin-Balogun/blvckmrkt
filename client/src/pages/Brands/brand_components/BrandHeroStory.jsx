import {MotionConfig} from "framer-motion";
import HeroIntro from "./HeroIntro";
import StorySection from "./StorySection";
import PersonalizationSection from "./PersonalizationSection";
import {DEFAULT_STORY_LINES} from "./storyDefaults";

export default function BrandHeroStory({brand}) {
  if (!brand?.hero_center_image_url) return null;

  const storyImages = [
    brand.hero_center_image_url,
    brand.hero_left_image_url,
    brand.hero_right_image_url,
  ].filter(Boolean);

  const storyLines = [brand.story_line_1, brand.story_line_2, brand.story_line_3];

  return (
    <MotionConfig reducedMotion="user">
      <div style={{position: "relative"}}>
        <HeroIntro
          brandName={brand.brand_name}
          leftImage={brand.hero_left_image_url}
          centerImage={brand.hero_center_image_url}
          rightImage={brand.hero_right_image_url}
        />
        {storyImages.map((image, i) => (
          <StorySection
            key={i}
            index={i}
            image={image}
            headline={(storyLines[i] || "").trim() || DEFAULT_STORY_LINES[i % DEFAULT_STORY_LINES.length]}
          />
        ))}
        <PersonalizationSection brandName={brand.brand_name} image={storyImages[0]} />
      </div>
    </MotionConfig>
  );
}
