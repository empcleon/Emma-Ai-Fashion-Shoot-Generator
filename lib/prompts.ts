
// lib/prompts.ts

export const fullBodyPrompts = {
  front: {
    ultra: `ULTRA-REALISTIC E-COMMERCE PHOTOGRAPHY. STRICT IDENTITY PRESERVATION.

**SUBJECT IDENTITY & BODY (CRITICAL PRIORITY):**
- The model MUST BE the exact same person from Input Image 1.
- RETAIN EXACT FACIAL FEATURES: Preserve the exact eyes, nose, lips, jawline, and bone structure of Image 1. Do NOT generate a generic fashion model face.
- RETAIN BODY MEASUREMENTS: Keep the exact body shape, height (1.78m tall), curves, and proportions from Image 1. The body volume must match the reference subject perfectly.
- Skin texture must be identical to the subject in Image 1 (moles, freckles, specific skin tone).

**GARMENT INTEGRATION:**
- The subject is wearing the garment from Input Image 2.
- The garment is accurately fitted to the subject's specific body measurements (not a standard mannequin size).
- Fabric texture, color, and drape from Image 2 are preserved and rendered realistically on the subject's body.
- Realistic fabric tension across the chest, waist, and hips based on the subject's pose.

**PHOTOGRAPHY & LIGHTING:**
- Full-body studio shot, head to toe.
- High-end e-commerce lighting: Soft, diffused, neutral daylight (5500K).
- No harsh shadows on the face.
- Background: Solid clean light grey (#f0f0f0).
- 8k resolution, raw photo style, sharp focus on fabric details and face.

**NEGATIVE PROMPT (Avoid):**
- (generic model face, changing body weight, plastic skin, 3d render, cartoon, distorted face, different person, changing hair color, changing ethnicity).`,
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
