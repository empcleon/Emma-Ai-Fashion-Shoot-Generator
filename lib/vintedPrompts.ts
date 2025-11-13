// lib/vintedPrompts.ts

export const vintedMasterFront = `**PROMPT FRONTAL PROFESIONAL:**

Create a hyperrealistic e-commerce photograph for Vinted marketplace.

**TECHNICAL SPECIFICATIONS:**
- Camera: Shot with Canon 5D Mark IV, 50mm lens, f/8, soft studio lighting
- Style: Clean commercial fashion photography, not artistic
- Resolution: 4K, sharp focus on garment details
- Color grading: Neutral, true-to-life colors

**MODEL & POSE:**
- Professional female model, size EU 38/Medium build
- Natural standing pose: weight evenly distributed, arms relaxed at sides
- Subtle hand positioning: one hand lightly touching hip or thigh
- Body angle: Straight on, very slight 10-degree turn for dimension
- Natural posture showing how garment falls on real body

**FRAMING - CRITICAL:**
- Frame cuts at lower neck/collarbone level (NO HEAD/FACE visible)
- Full body visible down to ankles/feet
- 80% of frame filled with model, 10% margin each side
- Vertical orientation, 3:4 aspect ratio ideal for mobile viewing

**GARMENT PRESENTATION:**
- Garment from reference image
- Natural fabric behavior: realistic wrinkles, drape, movement
- Proper fit on body: not too tight, not too loose
- Visible texture details: fabric weave, buttons, zippers, seams

**STUDIO SETUP:**
- Background: Seamless paper backdrop, color #F5F5F5 (95% white)
- Lighting: Two softboxes 45 degrees front, one fill light
- No shadows under feet (shadowless floor)
- Even illumination highlighting garment texture

**MANDATORY REQUIREMENTS:**
Professional product photo aesthetic, NOT:
- CGI/3D render look
- Mannequin/plastic appearance  
- Artistic fashion editorial
- Instagram lifestyle photo
- AI-generated artifacts

**OUTPUT:** Commercial catalog photo, anonymous model, focus on garment`;

export const vintedMasterBack = `**PROMPT TRASERA PROFESIONAL:**

Create a hyperrealistic BACK VIEW e-commerce photograph for Vinted.

**CAMERA SETUP:**
- Shooting from directly behind model
- Same height as front view for consistency
- Canon 5D Mark IV, 50mm lens, f/8
- Identical lighting setup as front view

**MODEL POSITIONING - BACK VIEW:**
- Standing naturally, facing away from camera
- Weight evenly distributed, shoulders relaxed
- Arms hanging naturally or one hand on hip (visible from back)
- Hair pulled to one side or up (if would obscure garment detail)
- Same model as front view for consistency

**CRITICAL FRAMING:**
- Top of frame: Base of neck/top of shoulders
- NO head, hair only if falls below neck
- Bottom of frame: Include feet/shoes
- Maintain exact same crop ratio as front view

**GARMENT DETAILS TO CAPTURE:**
- Back design elements: zippers, buttons, patterns
- How garment fits across shoulders and back
- Waistline definition from behind
- Length and hemline from back angle
- Any back pockets, belts, or details

**TECHNICAL CONSISTENCY:**
- Identical background: #F5F5F5 seamless
- Same lighting temperature (5600K daylight)
- Matching exposure and color grading
- Same post-processing style

**AVOID:**
- Model looking over shoulder
- Twisted or unnatural poses
- Different lighting than front
- Shadows inconsistent with front view

**RESULT:** Professional back view that pairs perfectly with front`;

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

Professional Vinted listing photo of woman wearing [describe dress].

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

Commercial photo of model wearing [describe top] with simple fitted jeans.

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

E-commerce photo focusing on [describe pants] worn with simple white tee.

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

Professional photo of [describe jacket] worn open over basic outfit.

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
