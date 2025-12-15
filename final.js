const express = require("express");
const app = express();
const path = require("path");
const portNumber = 7000;
const bodyParser = require("body-parser");

require("dotenv").config({
   path: path.resolve(__dirname, "credentialsDontPost/.env"),
});
const routes = require("./routes/recipes");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/recipes", routes);
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));

app.get("/", (req, res) => {
  res.render("index");
});

const mongoose = require("mongoose");
const uri = process.env.MONGO_CONNECTION_STRING;

mongoose.connect(uri)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error(err));

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
    ingredients: [String]
  },
  { timestamps: true, 
    collection: "favoriteRecipes"
  }
);

const FavoriteRecipe = mongoose.model(
  "FavoriteRecipe",
  FavoriteRecipeSchema
);

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

    console.log("Test compleate");
  } catch (err) {
    console.error("Test Fail", err);
  }
}

module.exports = {
  saveFavorite,
  getAllFavorites,
  getFavoriteById,
  deleteFavorite,
  deleteAllFavorites
};

app.listen(portNumber);
console.log(`main URL http://localhost:${portNumber}/`);

mongoose.connection.once("open", async () => {
  await testFavoriteRecipeDB();
});