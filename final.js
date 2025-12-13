const express = require("express");
const app = express();
const path = require("path");
const portNumber = 7000;
const bodyParser = require("body-parser");

require("dotenv").config({
   path: path.resolve(__dirname, "credentialsDontPost/.env"),
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));

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
  { timestamps: true }
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

module.exports = {
  saveFavorite,
  getAllFavorites,
  getFavoriteById,
  deleteFavorite,
  deleteAllFavorites
};

app.listen(portNumber);
console.log(`main URL http://localhost:${portNumber}/`);