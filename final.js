const express = require("express");
const app = express();
const path = require("path");
const portNumber = 7000;
const bodyParser = require("body-parser");

require("dotenv").config({
    path: path.resolve(__dirname, "credentialsDontPost/.env"),
});

const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));


const mongoose = require("mongoose");
const uri = process.env.MONGO_CONNECTION_STRING;

mongoose
    .connect(uri)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error(err));

const FavoriteRecipeSchema = new mongoose.Schema(
    {
        edamamId: { type: String, index: true, unique: true },
        name: { type: String, required: true },
        image: String,
        source: String,
        sourceUrl: String,
        calories: Number,
        servings: Number,
        totalTime: Number,
        ingredients: [String],
    },
    { 
        timestamps: true,
        collection: "favoriteRecipes"
    }
);

const FavoriteRecipe = mongoose.model("FavoriteRecipe", FavoriteRecipeSchema);

async function saveFavorite(recipe) {
    return FavoriteRecipe.findOneAndUpdate(
        { edamamId: recipe.edamamId },
        { $set: recipe },
        { upsert: true, new: true }
    );
}

async function getAllFavorites() {
    return FavoriteRecipe.find().sort({ createdAt: -1 });
}

async function getFavoriteById(id) {
    return FavoriteRecipe.findById(id);
}

async function deleteFavorite(id) {
    return FavoriteRecipe.findByIdAndDelete(id);
}

async function deleteAllFavorites() {
    return FavoriteRecipe.deleteMany({});
}

async function testFavoriteRecipeDB() {
    console.log("Start Test");
    const testRecipe = {
        edamamId: "test-recipe-222",
        name: "Test beef Recipe",
        image: "beefimage.jpg",
        source: "Test Source2",
        sourceUrl: "https://www.twopeasandtheirpod.com/easy-beef/",
        calories: 700,
        servings: 3,
        totalTime: 45,
        ingredients: [
            "3 pounds beef",
            "1 tbsp olive oil",
            "Salt",
            "Pepper"
        ]
    };
    try {
        //Save favorite
        const saved = await saveFavorite(testRecipe);
        console.log("Saved recipe:");
        console.log(saved);
        
        //Fetch all favorites
        const allFavorites = await getAllFavorites();
        console.log(`Total favorites in DB: ${allFavorites.length}`);
        
        //Verify the test recipe exists
        const found = allFavorites.find(
            r => r.edamamId === testRecipe.edamamId
        );
        if (found) {
            console.log("Test recipe found");
        } else {
            console.log("Test recipe NOT found");
        }
        console.log("Test complete");
    } catch (err) {
        console.error("Test Fail", err);
    }
}



/* ---------------- HELPERS ---------------- */

function renderRecipeGrid(recipes) {
  if (!recipes || recipes.length === 0) {
    return `<p class="empty-msg">No saved recipes yet.</p>`;
  }

  let html = `<div class="recipe-grid">`;

  for (const recipe of recipes) {
    html += `
      <div class="recipe-card">
        <img src="${recipe.image}" alt="${recipe.name}" />
        <h3>${recipe.name}</h3>
        <p>Calories: ${Math.round(recipe.calories)}</p>

        <a href="${recipe.sourceUrl}" target="_blank">View Source</a>

        <form action="/recipes/delete/${recipe._id}" method="POST">
          <button class="delete-btn">Remove</button>
        </form>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

/* ---------------- ROUTES ---------------- */

app.get("/", (req, res) => {
  res.render("index");
});

/* Search page */
app.get("/recipes/search", (req, res) => {
  res.render("search", { recipes: [], searchPerformed: false });
});

/* Search results */
app.get("/recipes/results", async (req, res) => {
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

    const recipes = data.hits.map(hit => ({
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
    res.render("search", { recipes: [], searchPerformed: true });
  }
});

/* Favorites page */
app.get("/recipes/favorites", async (req, res) => {
  try {
    const recipes = await getAllFavorites();
    res.render("stores", {
      favorites: renderRecipeGrid(recipes)
    });
  } catch {
    res.render("stores", {
      favorites: `<p class="empty-msg">Failed to load recipes.</p>`
    });
  }
});

/* Save favorite */
app.post("/recipes/save", async (req, res) => {
  const recipeData = JSON.parse(req.body.recipeData);

  await saveFavorite({
    edamamId: recipeData.edamamId,
    name: recipeData.label,
    image: recipeData.image,
    source: recipeData.source,
    sourceUrl: recipeData.url,
    calories: recipeData.calories,
    servings: recipeData.yield,
    totalTime: recipeData.totalTime,
    ingredients: recipeData.ingredients,
  });

  res.redirect("/recipes/favorites");
});

/* Delete favorite */
app.post("/recipes/delete/:id", async (req, res) => {
  await deleteFavorite(req.params.id);
  res.redirect("/recipes/favorites");
});

/* ---------------- START SERVER ---------------- */

app.listen(portNumber, () => {
  console.log(`http://localhost:${portNumber}`);
});