const mongoose = require("mongoose");
const validator = require("validator");
const slugify = require("slugify");
const geoCoder = require("../utils/geocoder");

const jobSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, "Veuillez entrer un titre."],
    trim: true,
    maxLength: [
      100,
      "Le titre de l'offre d'emploi ne doit pas dépasser 100 caractères."
    ]
  },
  slug: String,
  description: {
    type: String,
    required: [true, "Veuillez ajouter une description"],
    maxLength: [
      5000,
      "Le titre de l'offre d'emploi ne doit pas dépasser 5000 caractères."
    ]
  },
  email: {
    type: String,
    validate: [validator.isEmail, "Veuillez saisir une adresse email correct."]
  },
  adresse: {
    type: String,
    required: [true, "Veuillez saisir une adresse"]
  },
  location: {
    type: {
      type: String,
      enum: ["Point"]
    },
    coordinates: {
      type: [Number],
      index: "2dsphere"
    },
    formattedAddress: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },
  entreprise: {
    type: String,
    required: [true, "Veuillez saisir une entreprise"]
  },
  secteur: {
    type: [String],
    required: [true, "Veuillez saisir un secteur d'activité."],
    enum: {
      values: ["Logistique", "Informatique", "Banque"],
      message: "Veuillez selectionner un secteur d'activité"
    }
  },
  jobType: {
    type: String,
    required: [true, "Veuillez selectionner le type de contrat"],
    enum: {
      values: [
        "CDI",
        "CDD",
        "Stage/Alternance",
        "VIE",
        "Freelance/Indépendant"
      ],
      message: "Veuillez chosir le type de contrat"
    }
  },
  etude: {
    type: String,
    required: [true, "Veuillez selectionner un niveau d'étude"],
    enum: {
      values: [
        "Bac",
        "Bts",
        "Licence professionnelle",
        "Master professionnel",
        "Mastère Spécialisé",
        "Doctorat",
        "Autres diplômes"
      ],
      message: "Veuillez choisir un niveau détude."
    }
  },
  positions: {
    type: Number,
    default: 1
  },
  experience: {
    type: String,
    required: [true, "Veuillez selectionner un niveau d'experience"],
    enum: {
      values: ["Pas d'experience", "1 à 2 ans", "2 à 5 ans", "Plus de 5 ans"],
      message: "Veuillez selectionner un niveau d'experience."
    }
  },
  salaire: {
    type: Number,
    required: [true, "Veuillez saisir le niveau de salaire"]
  },
  datePublication: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    default: new Date().setDate(new Date().getDate() + 45)
  },
  postulants: {
    type: [Object],
    select: false
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  }
});

//Création du slug du job avant l'enregistrement d'un job
jobSchema.pre("save", function(next) {
  //Création du slug du job avant l'enregistrement dans la base de données'
  this.slug = slugify(this.titre, { lower: true });

  next();
});

//Mise en place du géocodage des données de localisation
jobSchema.pre("save", async function(next) {
  const loc = await geoCoder.geocode(this.adresse);

  this.location = {
    type: "Point",
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode
  };
  next();
});

module.exports = mongoose.model("Job", jobSchema);
