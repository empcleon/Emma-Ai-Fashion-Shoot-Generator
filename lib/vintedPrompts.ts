// lib/vintedPrompts.ts

export const vintedMasterFront = `**PROMPT FRONTAL PROFESIONAL PARA VINTED:**

Create a hyperrealistic e-commerce photograph for a marketplace like Vinted. The subject is wearing the garment from the second image.

**SUBJECT & POSE (INSTRUCTIONS WILL BE PREPENDED DYNAMICALLY):**
- The main subject's characteristics (human model or mannequin) and body proportions will be provided in a separate instruction block.
- The pose should be a natural, standing pose suitable for e-commerce: weight evenly distributed, arms relaxed.
- The body should be angled straight-on to the camera.
- The overall look must be natural, showing how the garment falls on a body.

**FRAMING - CRITICAL:**
- Frame cuts at the lower neck/collarbone level to ensure anonymity (NO HEAD/FACE visible).
- Full body shot showing the garment down to the ankles/feet.
- Vertical orientation, 3:4 aspect ratio, ideal for mobile viewing.

**GARMENT PRESENTATION:**
- Garment from the second reference image.
- Natural fabric behavior: realistic wrinkles, drape, and texture.
- The fit on the body must be accurate and natural.

**STUDIO SETUP:**
- Background: Seamless, professional, light grey paper backdrop (#F5F5F5).
- Lighting: Clean, even, soft studio lighting (e.g., two softboxes at 45 degrees).
- Shadowless floor.

**MANDATORY REQUIREMENTS:**
The final image must have a professional product photo aesthetic.
AVOID: Artistic editorials, lifestyle photos, inconsistent lighting, or obvious AI artifacts.

**OUTPUT:** A clean, commercial catalog-style photo focused on the garment.`;

export const vintedMasterBack = `**PROMPT TRASERA PROFESIONAL PARA VINTED:**

Create a hyperrealistic BACK VIEW e-commerce photograph for a marketplace like Vinted. The subject is wearing the garment from the second image.

**SUBJECT & POSE (INSTRUCTIONS WILL BE PREPENDED DYNAMICALLY):**
- The main subject's characteristics (human model or mannequin) and body proportions will be provided in a separate instruction block.
- The pose should be from directly behind, facing away from the camera.
- Hair should be pulled aside if it obscures back details of the garment.

**FRAMING - CRITICAL:**
- Frame cuts at the lower neck/collarbone level (NO HEAD/FACE visible).
- Full body shot showing the garment down to the ankles/feet.
- Vertical orientation, 3:4 aspect ratio.

**GARMENT PRESENTATION (BACK VIEW):**
- Focus on back design elements: zippers, back cutouts, ties.
- Show how the garment fits across the shoulders and back.

**STUDIO SETUP:**
- Background: Seamless, professional, light grey paper backdrop (#F5F5F5).
- Lighting: Clean, even, soft studio lighting.
- Shadowless floor.

**MANDATORY REQUIREMENTS:**
- Must match the style and quality of the front view image.
- AVOID: Subject looking over the shoulder, twisted poses.

**OUTPUT:** A clean, commercial catalog-style back view photo.`;

const commonTechnicalSpecs = `
**TECHNICAL SPECIFICATIONS:**
- Camera: Shot with Canon 5D Mark IV, 50mm lens, f/8, soft studio lighting
- Style: Clean commercial fashion photography, not artistic
- Resolution: 4K, sharp focus on garment details
- Color grading: Neutral, true-to-life colors

**FRAMING - CRITICAL:**
- Frame cuts at lower neck/collarbone level (NO HEAD/FACE visible)
- Full body visible down to ankles/feet
- Vertical orientation, 3:4 aspect ratio

**STUDIO SETUP:**
- Background: Seamless paper backdrop, color #F5F5F5 (95% white)
- Lighting: Two softboxes 45 degrees front
- No shadows under feet

**MANDATORY REQUIREMENTS:**
Professional product photo aesthetic, NOT:
- CGI/3D render look
- Mannequin/plastic appearance  
- Artistic fashion editorial

**OUTPUT:** Commercial catalog photo, anonymous model, focus on garment
`;

export const vintedSpecialized = {
  dress: `**VESTIDO - VISTA FRONTAL:**

Vinted listing photo. The subject is wearing the dress from the reference image.

**POSE SPECIFICS FOR DRESSES:**
- One hand gently holding dress fabric at thigh level
- Other arm relaxed, showing dress silhouette
- Feet positioned to show dress length clearly
- Standing on white platform/floor, barefoot or nude heels

**DRESS-SPECIFIC DETAILS:**
- Show natural fall and movement of skirt
- Highlight waistline definition
- Display neckline shape clearly
- Capture any patterns or prints in full
${commonTechnicalSpecs}`,

  top: `**TOP/BLUSA - VISTA FRONTAL:**

Vinted listing photo. The subject is wearing the top from the reference image, paired with simple fitted jeans.

**POSE FOR TOPS:**
- Both arms slightly away from body to show shirt cut
- One hand in pocket, one relaxed
- Straight posture to show fit properly
- Top tucked/untucked as typically worn

**TOP-SPECIFIC FOCUS:**
- Clear view of neckline and collar
- Sleeve length and cut visible
- Fabric texture in focus
- How top falls at hip level

**STYLING:** Plain dark jeans or black pants to not distract from top
${commonTechnicalSpecs}`,

  pants: `**PANTALONES - VISTA FRONTAL:**

Vinted listing photo. The subject is wearing the pants from the reference image, paired with a simple white tee.

**POSE FOR PANTS:**
- Feet slightly apart to show pant cut
- One foot slightly forward
- Hands in pockets or one on hip
- Weight distributed to show natural fit

**PANTS-SPECIFIC DETAILS:**
- Waistband height clearly visible
- Leg cut and width accurate
- Length and break at ankle
- Pocket placement and size
- Any distressing or details

**STYLING:** Plain white fitted t-shirt tucked in to show waistband
${commonTechnicalSpecs}`,

  jacket: `**CHAQUETA - VISTA FRONTAL:**

Vinted listing photo. The subject is wearing the jacket from the reference image, open over a basic outfit.

**POSE FOR OUTERWEAR:**
- Jacket open to show lining
- Arms slightly bent to show sleeve length
- Shoulders back to display structure
- One hand in jacket pocket if applicable

**OUTERWEAR SPECIFICS:**
- Show both open and shape
- Highlight buttons/zippers
- Display collar and lapels
- Show length relative to body

**LAYERING:** Simple white tee and dark jeans underneath
${commonTechnicalSpecs}`,
};