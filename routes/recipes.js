const express = require("express");
const router = express.Router();

const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;

// Import database functions from final.js
const { getAllFavorites, saveFavorite, deleteFavorite } = require("../final");

/* Search page */
router.get("/search", (req, res) => {
    res.render("search", { recipes: [], searchPerformed: false });
});

/* Search results (also handles GET requests from search form) */
router.get("/results", async (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.render("search", { recipes: [], searchPerformed: false });
    }

    const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(
        query
    )}&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const recipes = data.hits.map((hit) => ({
            edamamId: hit.recipe.uri.split("#recipe_")[1],
            label: hit.recipe.label,
            image: hit.recipe.image,
            source: hit.recipe.source,
            url: hit.recipe.url,
            calories: Math.round(hit.recipe.calories),
            yield: hit.recipe.yield,
            totalTime: hit.recipe.totalTime,
            ingredients: hit.recipe.ingredientLines,
        }));

        res.render("search", { recipes, searchPerformed: true });
    } catch (err) {
        console.error(err);
        res.render("search", {
            recipes: [],
            searchPerformed: true,
            error: "Failed to fetch recipes.",
        });
    }
});

/* Favorites/Stored recipes page */
router.get("/favorites", async (req, res) => {
    try {
        const recipes = await getAllFavorites();
        res.render("stores", { recipes });
    } catch (err) {
        console.error(err);
        res.render("stores", { recipes: [] });
    }
});

/* Save a recipe to favorites */
router.post("/save", async (req, res) => {
    try {
        const recipeData = JSON.parse(req.body.recipeData);

        const recipe = {
            edamamId: recipeData.edamamId,
            name: recipeData.label,
            image: recipeData.image,
            source: recipeData.source,
            sourceUrl: recipeData.url,
            calories: recipeData.calories,
            servings: recipeData.yield,
            totalTime: recipeData.totalTime,
            ingredients: recipeData.ingredients,
        };

        await saveFavorite(recipe);
        res.redirect("/recipes/favorites");
    } catch (err) {
        console.error(err);
        res.redirect("/recipes/search");
    }
});

/* Delete a saved recipe */
router.post("/delete/:id", async (req, res) => {
    try {
        await deleteFavorite(req.params.id);
        res.redirect("/recipes/favorites");
    } catch (err) {
        console.error(err);
        res.redirect("/recipes/favorites");
    }
});

/* Individual recipe page */
router.get("/:id", async (req, res) => {
    const recipeId = req.params.id;

    const url = `https://api.edamam.com/api/recipes/v2/${recipeId}?type=public&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const recipe = {
            edamamId: recipeId,
            label: data.recipe.label,
            image: data.recipe.image,
            source: data.recipe.source,
            url: data.recipe.url,
            calories: Math.round(data.recipe.calories),
            servings: data.recipe.yield,
            totalTime: data.recipe.totalTime,
            ingredients: data.recipe.ingredientLines,
        };

        res.render("recipe", { recipe });
    } catch (err) {
        console.error(err);
        res.render("recipe", { recipe: null });
    }
});

module.exports = router;
