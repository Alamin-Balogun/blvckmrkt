// Builds the ordered list of garments (up to 3) from the flat brand fields.
// A garment only appears if its front angle is uploaded — back/left/right
// are optional per garment, matching the dashboard's "front required" rule.
export function buildGarments(brand) {
  if (!brand) return [];

  return [1, 2, 3]
    .map((n) => ({
      front: brand[`garment_${n}_front_image_url`] || "",
      back: brand[`garment_${n}_back_image_url`] || "",
      left: brand[`garment_${n}_left_image_url`] || "",
      right: brand[`garment_${n}_right_image_url`] || "",
    }))
    .filter((g) => g.front);
}

export function hasGarmentShowcase(brand) {
  return buildGarments(brand).length > 0;
}
