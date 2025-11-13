// lib/prompts.ts

export const fullBodyPrompts = {
  front: {
    ultra: `ULTRA-REALISTIC E-COMMERCE FULL-BODY PHOTOGRAPH:

**SKIN REALISM (MOST IMPORTANT):**
- Natural human skin with VISIBLE PORES and realistic texture
- Skin shows subtle color variations, natural undertones, and organic complexion
- NO plastic appearance, NO mannequin look, NO CGI smooth skin, NO airbrushed effect
- Natural skin highlights on forehead, nose, and cheekbones
- Subtle imperfections that make the skin look authentically human

**GARMENT FROM SECOND IMAGE:**
- The model is wearing the garment shown in the second reference image
- The garment is fitted naturally to her body with realistic fabric physics
- Show natural draping, organic wrinkles at movement points (waist, elbows)
- Fabric texture is clearly visible with accurate material properties
- The garment is the central focus of the photograph

**POSE & COMPOSITION:**
- Full body shot from head to toe, model centered in frame
- Natural, elegant standing pose suitable for showcasing the dress silhouette
- Slight weight shift (contrapposto) for authentic human posture
- Arms positioned naturally to display the dress fit and style
- Confident but approachable expression, looking at camera

**PHOTOGRAPHY SPECIFICATIONS:**
- Shot with Canon 5D Mark IV, 85mm f/1.8 lens at f/2.8 aperture
- Professional studio setup with large softbox main light positioned 45° camera left
- Fill light: silver reflector camera right for gentle shadow fill
- Background light: subtle separation from backdrop
- Sharp focus on face and garment, shallow depth of field

**ENVIRONMENT:**
- Seamless, minimalist studio background
- Solid light grey backdrop (#f0f0f0)
- Clean, professional e-commerce aesthetic
- No distracting elements

**LIGHTING:**
- Soft, diffused, professional studio lighting
- Even illumination eliminating harsh shadows
- Natural light falloff creating subtle depth
- Highlights the dress texture and construction details
- Color temperature: 5500K (neutral daylight)

**IMAGE QUALITY:**
- Indistinguishable from a real DSLR photograph
- High resolution (8K quality), tack sharp detail
- Realistic hair with individual strands visible
- Authentic fabric texture with material-accurate weave/knit
- Professional color grading: neutral, true-to-life
- NO digital artifacts, NO over-smoothing, NO unnatural elements

**FINAL CHECK:**
This must look like a professional fashion photographer captured a REAL HUMAN WOMAN wearing a real dress in a real studio, NOT a computer-generated image.

--no plastic skin, mannequin, doll, 3D render, CGI, smooth skin, airbrushed, artificial, synthetic, video game graphics, cartoon, illustration, stiff pose, awkward hands, distorted anatomy, harsh lighting, overexposed, low quality, blurry`,
    fast: `Fast, highly realistic, full-body e-commerce photo of a model wearing the garment from the second image. Clean, minimalist light-grey studio background with professional lighting. Photorealistic style, NOT CGI.`
  },
  back: {
    ultra: `ULTRA-REALISTIC E-COMMERCE BACK VIEW PHOTOGRAPH:

**SKIN REALISM (VISIBLE AREAS):**
- All visible skin (neck, arms, legs, back if exposed) has natural human texture
- VISIBLE PORES and realistic skin surface on exposed areas
- NO plastic appearance, NO mannequin look, NO smooth CGI skin
- Natural skin color and texture consistent with front view

**GARMENT FROM SECOND IMAGE (BACK VIEW):**
- The model is wearing the back view of the garment from the second reference image
- FOCUS on back design elements: zipper, buttons, back cutouts, ties, lacing, closure details
- Show how the fabric drapes down the back with natural fall and weight

**BACK VIEW SPECIFICS:**
- Full body shot from directly behind, showing head to feet
- Back of the head with natural hair fall
- Hair has realistic texture, individual strands, natural weight and movement
- Natural standing posture from the back with slight weight shift
- Arms relaxed or positioned to show dress silhouette from behind

**PHOTOGRAPHY SPECIFICATIONS:**
- Same setup as front view: Canon 5D Mark IV, 85mm f/1.8 lens at f/2.8
- Studio lighting from behind camera with subtle rim lighting on edges
- Consistent with front view quality and lighting
- Same light grey background (#f0f0f0)

**IMAGE QUALITY:**
- Same photorealistic quality as front view
- Sharp focus on back dress details (zipper, closures, back design)
- 8K resolution showing all back construction elements
- Natural hair texture, realistic fabric draping
- Consistent color grading with front image

**FINAL CHECK:**
This must look like a professional back view photograph of the SAME REAL WOMAN from the front shot, wearing the same real dress, NOT a 3D render or different person.

--no plastic skin, mannequin, 3D render, CGI, smooth skin, artificial, front-facing, face visible, different person, inconsistent lighting, stiff pose, unnatural hair`,
    fast: `Fast, highly realistic, full-body e-commerce photo of a model from the back, wearing the garment from the second image. Clean, minimalist light-grey studio background with professional lighting. Photorealistic style, NOT CGI.`
  },
  variations: {
    dress: `GARMENT SPECIFICS:
- Pay close attention to the hemline and how the fabric falls around the legs, respecting the original length.
- Ensure the dress silhouette (e.g., A-line, bodycon, sheath) is accurately represented.
- Realistic fabric texture, showing any pleats, gathers, or patterns clearly.`,
    pants: `GARMENT SPECIFICS:
- The jeans/pants fit naturally around waist, hips, and legs
- Realistic denim/fabric texture with visible weave pattern
- Natural creases at knees and hip joints
- Authentic hem break at ankles showing fabric weight
- Belt loops, pockets, and stitching clearly visible
- Proper rise (high/mid/low) showing accurate fit

POSE ADJUSTMENT:
- Legs slightly apart in natural standing position
- Weight on one leg creating authentic hip tilt
- Fabric pulls and stretches realistically at stress points`,
    top: `GARMENT SPECIFICS:
- The top fits naturally on shoulders, bust, and torso
- Fabric drapes from shoulder seams with gravity
- Natural gathering or stretch at waist/hem
- Sleeve fall is realistic showing fabric weight
- Collar and neckline sit naturally on body
- Any buttons, closures clearly visible and realistic

COMPOSITION:
- Full body OR 3/4 length (head to mid-thigh) both acceptable
- Arms positioned to show sleeve length and fit`,
    outerwear: `GARMENT SPECIFICS:
- The coat/jacket layers naturally over base clothing
- Heavy fabric drapes with appropriate weight and stiffness
- Lapels, collar stand up naturally with structure
- Sleeves show proper length and cuff detail
- Any closures (buttons, zippers) visible and realistic
- Show how outerwear silhouette frames the body

POSE:
- Can have one hand in pocket for natural look
- Coat may be open or closed as garment dictates`
  }
};