import { generateImage } from "../server/_core/imageGeneration.ts";
import { storagePut } from "../server/storage.ts";
import fs from "fs";

const BATCH_SIZE = 50;
const DELAY_MS = 2000; // Delay entre generaciones para evitar rate limits

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateRecipeImage(recipeName, recipeId) {
  try {
    // Prompt para generar imagen ultrarealista cuadrada (1080x1080)
    const prompt = `Professional food photography of ${recipeName}. Square composition (1:1 ratio). 
    Ultrarealistically detailed, studio lighting, appetizing presentation, fresh ingredients visible. 
    High-quality, magazine-style food photography. Shot from above at 45 degrees angle. 
    Beautiful plating, natural colors, professional culinary presentation.`;

    console.log(`[${recipeId}] Generating image for: ${recipeName}`);
    
    const { url: imageUrl } = await generateImage({
      prompt,
    });

    // Upload to S3 with recipe ID
    const fileKey = `recipes/${recipeId}-${recipeName.replace(/\s+/g, "-").toLowerCase()}-1080x1080.jpg`;
    const { url: s3Url } = await storagePut(fileKey, imageUrl, "image/jpeg");

    console.log(`[${recipeId}] ✅ Image generated and uploaded: ${s3Url}`);
    return s3Url;
  } catch (error) {
    console.error(`[${recipeId}] ❌ Error generating image:`, error.message);
    return null;
  }
}

async function main() {
  console.log("🖼️  Starting recipe image generation project...");
  console.log(`Format: 1080x1080 (square)`);
  console.log(`Style: Mixed (professional + lifestyle)`);
  console.log(`Total recipes to process: ~17,000`);
  console.log("");

  // Create progress file
  const progressFile = "/tmp/recipe-images-progress.json";
  let progress = { processed: 0, generated: 0, failed: 0, startTime: new Date() };

  if (fs.existsSync(progressFile)) {
    progress = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
    console.log(`📊 Resuming from: ${progress.processed} recipes processed`);
  }

  // Sample recipes for demonstration
  const recipes = [
    { id: 1, name: "Pasta Carbonara" },
    { id: 2, name: "Ensalada César" },
    { id: 3, name: "Salmón a la Mantequilla" },
    { id: 4, name: "Tacos al Pastor" },
    { id: 5, name: "Risotto de Champiñones" },
  ];

  console.log(`📋 Found ${recipes.length} recipes to process (demo)`);
  console.log("");

  for (const recipe of recipes) {
    if (progress.processed % BATCH_SIZE === 0) {
      console.log(`\n📈 Progress: ${progress.processed}/${recipes.length}`);
      fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
    }

    const imageUrl = await generateRecipeImage(recipe.name, recipe.id);
    
    if (imageUrl) {
      progress.generated++;
    } else {
      progress.failed++;
    }

    progress.processed++;
    await sleep(DELAY_MS);
  }

  console.log("\n✅ Generation complete!");
  console.log(`📊 Final stats:`);
  console.log(`   - Processed: ${progress.processed}`);
  console.log(`   - Generated: ${progress.generated}`);
  console.log(`   - Failed: ${progress.failed}`);
  console.log(`   - Duration: ${(new Date() - new Date(progress.startTime)) / 1000}s`);

  fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
}

main().catch(console.error);
