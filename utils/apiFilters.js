class APIFilters {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    //Création d'une copie du critère de recherche
    const queryCopy = { ...this.queryStr };

    //Exclusion de certains de mot clés des critères de recherche
    let removingFields = ["sort", "fields", "q", "limit", "page"];
    removingFields.forEach(el => delete queryCopy[el]);

    //Filtres avancés: lt, lte, gt, gte (https://docs.mongodb.com/manual/reference/operator/query/)
    let queryStr = JSON.stringify(queryCopy);

    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      match => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      //Trie multi-critères
      const sortBy = this.queryStr.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      //Trie par défaut
      this.query = this.query.sort("-datePublication");
    }
    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  searchByQuery() {
    if (this.queryStr.q) {
      const qu = this.queryStr.split("-").join(" ");
      this.query = this.query.find({ $text: { $seach: '"' + qu + '"' } });
    }

    return this;
  }

  pagination() {
    const page = parseInt(this.queryStr.page, 10) || 1;
    const limit = parseInt(this.queryStr.limit, 10) || 10;
    const skipResults = (page - 1) * limit;
    this.query = this.query.limit(skipResults).limit(limit);

    return this;
  }
}

module.exports = APIFilters;
