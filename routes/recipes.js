const express = require("express");
const router = express.Router();

const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;
const EDAMAM_USER_ID = process.env.EDAMAM_USER_ID;


/**
 * Search page
 */
router.get("/search", (req, res) => {
  res.render("search");
});

/**
 * Results
 */
router.post("/results", async (req, res) => {
  const query = req.body.query;

  if (!query) {
    return res.render("results", { recipes: [], error: "No search term provided." });
  }

  const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(
    query
  )}&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Edamam-Account-User": EDAMAM_USER_ID
      }
    });
    const data = await response.json();

    const recipes = data.hits.map(hit => ({
      edamamId: hit.recipe.uri.split("#recipe_")[1],
      name: hit.recipe.label,
      image: hit.recipe.image,
      source: hit.recipe.source,
      sourceUrl: hit.recipe.url,
      calories: Math.round(hit.recipe.calories),
      servings: hit.recipe.yield,
      totalTime: hit.recipe.totalTime,
      ingredients: hit.recipe.ingredientLines
    }));

    res.render("results", { recipes, error: null });
  } catch (err) {
    console.error(err);
    res.render("results", { recipes: [], error: "Failed to fetch recipes." });
  }
});

/**
 * Recipe page
 */
router.get("/:id", async (req, res) => {
  const recipeId = req.params.id;

  const url = `https://api.edamam.com/api/recipes/v2/${recipeId}?type=public&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Edamam-Account-User": EDAMAM_USER_ID
      }
    });
    const data = await response.json();

    const recipe = {
      edamamId: recipeId,
      name: data.recipe.label,
      image: data.recipe.image,
      source: data.recipe.source,
      sourceUrl: data.recipe.url,
      calories: Math.round(data.recipe.calories),
      servings: data.recipe.yield,
      totalTime: data.recipe.totalTime,
      ingredients: data.recipe.ingredientLines
    };

    res.render("recipe", { recipe });
  } catch (err) {
    console.error(err);
    res.render("recipe", { recipe: null });
  }
});

module.exports = router;